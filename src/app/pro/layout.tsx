import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/dal";

export default async function ProLayout({ children }: LayoutProps<"/pro">) {
  // Cada página também verifica; o layout evita renderizar a casca para quem não é profissional.
  await requireUser(["professional"], "/pro");
  return <AppShell section="pro">{children}</AppShell>;
}
