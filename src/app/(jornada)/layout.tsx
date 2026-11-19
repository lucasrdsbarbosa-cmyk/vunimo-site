import { AppShell } from "@/components/AppShell";

export default function JornadaLayout({ children }: LayoutProps<"/">) {
  return <AppShell section="jornada">{children}</AppShell>;
}
