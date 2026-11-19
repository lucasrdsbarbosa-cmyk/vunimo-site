"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icons";
import { useSlidingIndicator } from "./useSlidingIndicator";

export type NavItem = { href: string; label: string; icon: IconName; match?: string[]; exact?: boolean };

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
}

/** Direção da troca de aba: o conteúdo desliza para o lado da aba escolhida. */
function slideType(index: number, activeIndex: number): string[] | undefined {
  if (activeIndex < 0 || index === activeIndex) return undefined;
  return [index > activeIndex ? "vn-forward" : "vn-back"];
}

/** Navegação lateral (computador). */
export function SideNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  const activeIndex = items.findIndex((item) => isActive(pathname, item));
  const { rootRef, indRef } = useSlidingIndicator<HTMLUListElement, HTMLSpanElement>(activeIndex);
  return (
    <nav aria-label={label}>
      <ul ref={rootRef} className="relative grid gap-1">
        <span ref={indRef} aria-hidden="true" className="vn-ind vn-ind-side" />
        {items.map((item, i) => {
          const active = i === activeIndex;
          return (
            <li key={item.href} className="relative">
              <Link
                href={item.href}
                transitionTypes={slideType(i, activeIndex)}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-[0.98rem] transition-colors ${
                  active ? "font-semibold text-iris" : "text-grafite hover:bg-white/50"
                }`}
              >
                <Icon name={item.icon} className="vn-tab-icon h-5 w-5 shrink-0" data-active={active ? "" : undefined} />
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
  const activeIndex = items.findIndex((item) => isActive(pathname, item));
  const { rootRef, indRef } = useSlidingIndicator<HTMLUListElement, HTMLSpanElement>(activeIndex);
  return (
    <nav
      aria-label={label}
      style={{ viewTransitionName: "vn-tabbar" }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul ref={rootRef} className="relative mx-auto flex max-w-xl">
        <span ref={indRef} aria-hidden="true" className="vn-ind vn-ind-tab" />
        {items.map((item, i) => {
          const active = i === activeIndex;
          return (
            <li key={item.href} className="relative flex-1">
              <Link
                href={item.href}
                transitionTypes={slideType(i, activeIndex)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-1 pt-1 text-[0.72rem] leading-tight transition-colors ${
                  active ? "font-semibold text-iris" : "text-muted"
                }`}
              >
                <Icon
                  name={item.icon}
                  className="vn-tab-icon h-6 w-6"
                  strokeWidth={active ? 2.2 : 1.8}
                  data-active={active ? "" : undefined}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
