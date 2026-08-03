import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Order · NexusDine",
  description: "Scan, order, and track your meal in real time",
};

/** Lightweight public shell — no AppShell / auth chrome */
export default function GuestOrderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#FFF3EE] via-[#F8F9FA] to-[#F8F9FA] text-[#2F3E46]">
      {children}
    </div>
  );
}
