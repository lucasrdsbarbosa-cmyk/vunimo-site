"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Icon } from "./Icons";

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
    <header className="relative z-20 border-b border-line bg-papel">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Logo />
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`rounded-full px-3 py-2 text-[0.97rem] hover:bg-nevoa ${
                pathname === l.href ? "font-semibold text-iris" : "text-grafite"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link href={account?.href ?? "/entrar"} className="btn btn-secondary ml-2 min-h-11 px-5">
            {account?.label ?? "Entrar"}
          </Link>
        </nav>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-nevoa text-grafite md:hidden"
          aria-expanded={open}
          aria-controls="menu-celular"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
          <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
        </button>
      </div>
      {open ? (
        <nav id="menu-celular" aria-label="Principal" className="border-t border-line bg-papel px-4 pb-5 md:hidden">
          <ul className="grid">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex min-h-12 items-center border-b border-line/70 text-lg"
                  aria-current={pathname === l.href ? "page" : undefined}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={account?.href ?? "/entrar"} className="btn btn-primary mt-4 w-full">
            {account?.label ?? "Entrar"}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
