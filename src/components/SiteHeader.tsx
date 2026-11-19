"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { duration, ease, fadeUp, spring, staggerGroup } from "@/lib/motion";
import { Logo } from "./Logo";
import { Icon } from "./Icons";
import { HelpMenu } from "./HelpMenu";
import { AutoHideHeader } from "./AutoHideHeader";
import { slideType } from "./NavLinks";

const LINKS = [
  { href: "/comecar", label: "Começar" },
  { href: "/orientar", label: "Orientação" },
  { href: "/conectar", label: "Apoio" },
  { href: "/profissionais", label: "Para profissionais" },
  { href: "/sobre", label: "Sobre" },
];

export function SiteHeader({ account }: { account: { href: string; label: string } | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  // Fecha o menu ao navegar (ajuste de estado durante a renderização, sem efeito).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  const indicator = useId();
  const activeIndex = LINKS.findIndex((l) => l.href === pathname);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Esc fecha o menu e devolve o foco ao botão.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AutoHideHeader
      className="sticky top-0 z-40 border-b border-line/70 bg-papel/85 backdrop-blur-md"
      style={{ viewTransitionName: "vn-site-header" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo dockTarget={pathname === "/"} />

        <nav aria-label="Principal" className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l, i) => {
            const active = i === activeIndex;
            return (
              <Link
                key={l.href}
                href={l.href}
                transitionTypes={slideType(i, activeIndex)}
                aria-current={active ? "page" : undefined}
                className={`vn-underline relative rounded-full px-3 py-2 text-[0.97rem] transition-colors ${
                  active ? "font-semibold text-iris" : "text-grafite hover:text-iris"
                }`}
              >
                {active ? (
                  <motion.span layoutId={`topo-${indicator}`} transition={spring.snappy} aria-hidden="true" className="vn-ind vn-ind-top" />
                ) : null}
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <HelpMenu compact />
          <div className="hidden items-center gap-2 md:flex">
            {account ? (
              <Link href={account.href} className="btn btn-primary vn-press min-h-11 px-5">
                {account.label}
              </Link>
            ) : (
              <>
                <Link href="/entrar" className="btn btn-secondary vn-press min-h-11 px-5">
                  Entrar
                </Link>
                <Link href="/cadastro" className="btn btn-primary vn-press min-h-11 px-5">
                  Criar conta
                </Link>
              </>
            )}
          </div>
          <button
            ref={toggleRef}
            type="button"
            className="vn-press flex h-11 w-11 items-center justify-center rounded-full bg-nevoa text-grafite lg:hidden"
            aria-expanded={open}
            aria-controls="menu-celular"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="vn-burger" data-open={open ? "" : undefined} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="menu"
            id="menu-celular"
            data-open=""
            className="overflow-hidden lg:hidden"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0, transition: { duration: duration.base, ease: ease.out } }}
            transition={spring.gentle}
          >
            <motion.nav
              aria-label="Principal"
              className="border-t border-line px-4 pb-5 pt-2 sm:px-6"
              initial="hidden"
              animate="show"
              variants={staggerGroup(0.04, 0.05)}
            >
              <ul className="grid">
                {LINKS.map((l) => (
                  <motion.li key={l.href} variants={fadeUp}>
                    <Link
                      href={l.href}
                      className={`flex min-h-12 items-center justify-between border-b border-line/70 text-lg ${
                        pathname === l.href ? "font-semibold text-iris" : ""
                      }`}
                      aria-current={pathname === l.href ? "page" : undefined}
                    >
                      {l.label}
                      <Icon name="arrow" className="h-5 w-5 text-iris" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <motion.div variants={fadeUp} className="mt-4 grid gap-2 sm:grid-cols-2">
                {account ? (
                  <Link href={account.href} className="btn btn-primary">
                    {account.label}
                  </Link>
                ) : (
                  <>
                    <Link href="/cadastro" className="btn btn-primary">
                      Criar conta
                    </Link>
                    <Link href="/entrar" className="btn btn-secondary">
                      Entrar
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AutoHideHeader>
  );
}
