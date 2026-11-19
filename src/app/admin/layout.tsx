import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/dal";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireUser(["admin"], "/admin");
  return <AppShell section="admin">{children}</AppShell>;
}
