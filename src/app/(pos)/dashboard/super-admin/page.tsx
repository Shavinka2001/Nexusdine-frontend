import { redirect } from "next/navigation";

/** Legacy path — portal lives under /super-admin */
export default function LegacySuperAdminRedirect() {
  redirect("/super-admin/dashboard");
}
