import Link from "next/link";
import { RevealGroup, RevealItem } from "./motion/Reveal";
import { NUCLEI } from "@/lib/content";
import { Icon, type IconName } from "./Icons";

const ICONS: Record<string, IconName> = { pausa: "pause", desabafar: "chat", orientar: "compass", conectar: "people" };

/** "Como você quer começar?" — os quatro núcleos, em qualquer ordem. */
export function NucleusCards({ highlight = "pausa", exclude }: { highlight?: string; exclude?: string }) {
  const items = NUCLEI.filter((n) => n.key !== exclude);
  return (
    <RevealGroup className="grid gap-3 sm:grid-cols-2">
      {items.map((n) => {
        const featured = n.key === highlight;
        return (
          <RevealItem key={n.key}>
            <Link
              href={n.href}
              className={`group flex h-full min-h-24 items-center gap-4 rounded-[var(--radius-card)] p-5 vn-card ${
                featured
                  ? "on-iris bg-iris text-white hover:bg-iris-deep"
                  : "border border-line bg-white hover:border-iris"
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  featured ? "bg-white/15 text-lima" : "bg-nevoa text-iris"
                }`}
              >
                <Icon name={ICONS[n.key]} className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block text-xl font-semibold">{n.name}</span>
                <span className={featured ? "text-white/85" : "text-muted"}>{n.short}</span>
              </span>
              <Icon name="arrow" className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
