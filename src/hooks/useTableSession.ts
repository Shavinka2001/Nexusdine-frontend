"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  getOrCreateGuestDisplayName,
  getOrCreateGuestId,
} from "@/lib/guest-identity";
import { getSocketUrl } from "@/lib/public-api";
import type { QrSession } from "@/lib/qr-session";
import {
  useGuestCartStore,
  type GuestCartItem,
} from "@/store/useGuestCartStore";

export type WaiterRequestType =
  | "REQUEST_WATER"
  | "BRING_CUTLERY"
  | "CASH_PAYMENT"
  | "GENERAL_HELP";

export interface TableDinerPresence {
  guestId: string;
  displayName: string;
  color: string;
  joinedAt: string;
}

interface CartUpdatedPayload {
  tableId: string;
  items: GuestCartItem[];
  version: number;
  updatedByGuestId?: string | null;
}

interface TablePresencePayload {
  tableId: string;
  diners: TableDinerPresence[];
  count: number;
}

interface OrderPlacedPayload {
  tableId: string;
  orderId: string;
  orderNumber: string;
  branchId: string;
}

interface UseTableSessionOptions {
  session: QrSession | null;
  onOrderPlaced?: (payload: OrderPlacedPayload) => void;
  onWaiterAck?: (message: string) => void;
}

export function useTableSession({
  session,
  onOrderPlaced,
  onWaiterAck,
}: UseTableSessionOptions) {
  const replaceItems = useGuestCartStore((s) => s.replaceItems);
  const clear = useGuestCartStore((s) => s.clear);

  const [connected, setConnected] = useState(false);
  const [diners, setDiners] = useState<TableDinerPresence[]>([]);
  const [placing, setPlacing] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const applyingRemoteRef = useRef(false);
  const guestIdRef = useRef("");
  const displayNameRef = useRef("");
  const onOrderPlacedRef = useRef(onOrderPlaced);
  const onWaiterAckRef = useRef(onWaiterAck);
  onOrderPlacedRef.current = onOrderPlaced;
  onWaiterAckRef.current = onWaiterAck;

  const publishCart = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !session) return;
    if (applyingRemoteRef.current) return;
    socket.emit("updateSharedCart", {
      tableId: session.tableId,
      guestId: guestIdRef.current,
      tenantId: session.tenantId,
      branchId: session.branchId,
      items: useGuestCartStore.getState().items,
    });
  }, [session]);

  useEffect(() => {
    if (!session?.tableId) return;

    guestIdRef.current = getOrCreateGuestId();
    displayNameRef.current = getOrCreateGuestDisplayName();

    const socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    const join = () => {
      socket.emit(
        "joinTableSession",
        {
          tableId: session.tableId,
          guestId: guestIdRef.current,
          displayName: displayNameRef.current,
          tenantId: session.tenantId,
          branchId: session.branchId,
        },
        (ack?: {
          ok?: boolean;
          items?: GuestCartItem[];
          presence?: TablePresencePayload;
        }) => {
          if (!ack?.ok) return;
          applyingRemoteRef.current = true;
          if (Array.isArray(ack.items)) {
            replaceItems(ack.items);
          }
          if (ack.presence?.diners) {
            setDiners(ack.presence.diners);
          }
          queueMicrotask(() => {
            applyingRemoteRef.current = false;
          });
        },
      );
    };

    socket.on("connect", () => {
      setConnected(true);
      join();
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("cartUpdated", (payload: CartUpdatedPayload) => {
      if (payload.tableId !== session.tableId) return;
      if (payload.updatedByGuestId === guestIdRef.current) return;
      applyingRemoteRef.current = true;
      replaceItems(payload.items ?? []);
      queueMicrotask(() => {
        applyingRemoteRef.current = false;
      });
    });

    socket.on("tablePresence", (payload: TablePresencePayload) => {
      if (payload.tableId !== session.tableId) return;
      setDiners(payload.diners ?? []);
    });

    socket.on("orderPlaced", (payload: OrderPlacedPayload) => {
      if (payload.tableId !== session.tableId) return;
      applyingRemoteRef.current = true;
      clear();
      queueMicrotask(() => {
        applyingRemoteRef.current = false;
      });
      onOrderPlacedRef.current?.(payload);
    });

    socket.on(
      "waiterCallAck",
      (payload: { ok?: boolean; message?: string }) => {
        if (payload?.message) onWaiterAckRef.current?.(payload.message);
      },
    );

    const unsub = useGuestCartStore.subscribe((state, prev) => {
      if (state.items === prev.items) return;
      if (applyingRemoteRef.current) return;
      if (!socket.connected) return;
      socket.emit("updateSharedCart", {
        tableId: session.tableId,
        guestId: guestIdRef.current,
        tenantId: session.tenantId,
        branchId: session.branchId,
        items: state.items,
      });
    });

    return () => {
      unsub();
      socket.emit("leaveTableSession", {
        tableId: session.tableId,
        guestId: guestIdRef.current,
      });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setDiners([]);
    };
  }, [session?.tableId, session?.tenantId, session?.branchId, replaceItems, clear]);

  const placeSharedOrder = useCallback((): Promise<{
    orderId: string;
    orderNumber: string;
  }> => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket?.connected || !session) {
        reject(new Error("Not connected to the table session"));
        return;
      }
      setPlacing(true);
      // Push latest cart before placing
      publishCart();
      socket.emit(
        "placeSharedOrder",
        {
          tableId: session.tableId,
          tenantId: session.tenantId,
          branchId: session.branchId,
          guestId: guestIdRef.current,
        },
        (ack?: {
          ok?: boolean;
          orderId?: string;
          orderNumber?: string;
          error?: string;
        }) => {
          setPlacing(false);
          if (!ack?.ok || !ack.orderId || !ack.orderNumber) {
            reject(new Error(ack?.error || "Could not place order"));
            return;
          }
          resolve({ orderId: ack.orderId, orderNumber: ack.orderNumber });
        },
      );
    });
  }, [session, publishCart]);

  const callWaiter = useCallback(
    (requestType: WaiterRequestType): Promise<string> => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket?.connected || !session) {
          reject(new Error("Not connected to the table session"));
          return;
        }
        socket.emit(
          "callWaiter",
          {
            tableId: session.tableId,
            branchId: session.branchId,
            tableNumber: session.tableNumber,
            requestType,
            guestId: guestIdRef.current,
          },
          (ack?: { ok?: boolean; message?: string; error?: string }) => {
            if (!ack?.ok) {
              reject(new Error(ack?.error || "Could not notify staff"));
              return;
            }
            resolve(
              ack.message ||
                "Staff has been notified. A waiter is on their way.",
            );
          },
        );
      });
    },
    [session],
  );

  return {
    connected,
    diners,
    dinerCount: diners.length,
    guestId: guestIdRef.current,
    placing,
    placeSharedOrder,
    callWaiter,
  };
}
