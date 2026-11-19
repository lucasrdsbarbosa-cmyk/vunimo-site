"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Icon } from "./Icons";
import { HelpMenu } from "./HelpMenu";

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

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-papel/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo dockTarget={pathname === "/"} />

        <nav aria-label="Principal" className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`vn-underline rounded-full px-3 py-2 text-[0.97rem] ${
                pathname === l.href ? "font-semibold text-iris" : "text-grafite"
              }`}
            >
              {l.label}
            </Link>
          ))}
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

      <div id="menu-celular" className="vn-drawer lg:hidden" data-open={open ? "" : undefined} inert={!open}>
        <div className="overflow-hidden">
          <nav aria-label="Principal" className="border-t border-line px-4 pb-5 pt-2 sm:px-6">
            <ul className="grid">
              {LINKS.map((l, i) => (
                <li key={l.href} style={{ "--i": i } as React.CSSProperties} className="vn-drawer-item">
                  <Link
                    href={l.href}
                    className="flex min-h-12 items-center justify-between border-b border-line/70 text-lg"
                    aria-current={pathname === l.href ? "page" : undefined}
                  >
                    {l.label}
                    <Icon name="arrow" className="h-5 w-5 text-iris" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="vn-drawer-item mt-4 grid gap-2 sm:grid-cols-2" style={{ "--i": LINKS.length } as React.CSSProperties}>
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
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
