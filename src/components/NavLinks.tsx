"use client";

import Link from "next/link";
import { useId } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { spring } from "@/lib/motion";
import { Icon, type IconName } from "./Icons";

export type NavItem = { href: string; label: string; icon: IconName; match?: string[]; exact?: boolean };

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
}

/** Direção da troca de aba: o conteúdo desliza para o lado da aba escolhida. */
export function slideType(index: number, activeIndex: number): string[] | undefined {
  if (activeIndex < 0 || index === activeIndex) return undefined;
  return [index > activeIndex ? "vn-forward" : "vn-back"];
}

/** Ícone que dá um pulinho ao virar a aba ativa. */
function TabIcon({ name, active, className, strokeWidth }: { name: IconName; active: boolean; className: string; strokeWidth?: number }) {
  return (
    <motion.span
      key={active ? "ativo" : "inativo"}
      className="inline-flex"
      data-active={active ? "" : undefined}
      initial={active ? { scale: 0.8, y: 2 } : false}
      animate={{ scale: 1, y: 0 }}
      transition={spring.pop}
    >
      <Icon name={name} className={className} strokeWidth={strokeWidth} />
    </motion.span>
  );
}

/** Navegação lateral (computador). */
export function SideNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  const indicator = useId();
  const activeIndex = items.findIndex((item) => isActive(pathname, item));
  return (
    <nav aria-label={label}>
      <ul className="grid gap-1">
        {items.map((item, i) => {
          const active = i === activeIndex;
          return (
            <li key={item.href} className="relative">
              {active ? (
                <motion.span layoutId={`lateral-${indicator}`} transition={spring.snappy} aria-hidden="true" className="vn-ind vn-ind-side" />
              ) : null}
              <Link
                href={item.href}
                transitionTypes={slideType(i, activeIndex)}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-[0.98rem] transition-colors ${
                  active ? "font-semibold text-iris" : "text-grafite hover:bg-white/50"
                }`}
              >
                <TabIcon name={item.icon} active={active} className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barra inferior (celular), como nos estudos de interface. */
export function TabBar({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  const indicator = useId();
  const activeIndex = items.findIndex((item) => isActive(pathname, item));
  return (
    <nav
      aria-label={label}
      style={{ viewTransitionName: "vn-tabbar" }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl">
        {items.map((item, i) => {
          const active = i === activeIndex;
          return (
            <li key={item.href} className="relative flex-1">
              {active ? (
                <motion.span layoutId={`abas-${indicator}`} transition={spring.snappy} aria-hidden="true" className="vn-ind vn-ind-tab" />
              ) : null}
              <Link
                href={item.href}
                transitionTypes={slideType(i, activeIndex)}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-1 pt-1 text-[0.72rem] leading-tight transition-colors ${
                  active ? "font-semibold text-iris" : "text-muted"
                }`}
              >
                <TabIcon name={item.icon} active={active} className="h-6 w-6" strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
