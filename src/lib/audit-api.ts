import { api } from "@/lib/api";
import type { CancelledOrdersAudit } from "@/types/audit";

/** Owner-only cancelled order void audit */
export async function fetchCancelledOrdersAudit() {
  const { data } = await api.get<CancelledOrdersAudit>(
    "/analytics/cancelled-orders",
  );
  return data;
}
