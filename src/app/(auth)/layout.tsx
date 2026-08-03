import { ReactNode } from "react";
import { GuestRoute } from "@/components/providers/GuestRoute";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <GuestRoute>{children}</GuestRoute>;
}
