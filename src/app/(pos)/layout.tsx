import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function PosLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
