const STORAGE_KEY = "nexusdine.qr.session";

export interface QrSession {
  tenantId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  restaurantName?: string;
}

export function saveQrSession(session: QrSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadQrSession(): QrSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QrSession;
    if (!parsed?.tenantId || !parsed?.branchId || !parsed?.tableId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearQrSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
