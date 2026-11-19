import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser, type CurrentUser } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { Logo } from "./Logo";
import { Icon } from "./Icons";
import { SideNav, TabBar, type NavItem } from "./NavLinks";
import { HelpMenu } from "./HelpMenu";

type Section = "jornada" | "pro" | "admin";

function navFor(section: Section, user: CurrentUser | null): { main: NavItem[]; extra: NavItem[] } {
  if (section === "pro") {
    return {
      main: [
        { href: "/pro", label: "Painel", icon: "home", exact: true },
        { href: "/pro/pedidos", label: "Pedidos", icon: "inbox" },
        { href: "/pro/perfil", label: "Perfil", icon: "user" },
      ],
      extra: [{ href: "/conectar", label: "Ver diretório público", icon: "people" }],
    };
  }
  if (section === "admin") {
    return {
      main: [{ href: "/admin", label: "Profissionais", icon: "shield" }],
      extra: [{ href: "/conectar", label: "Ver diretório público", icon: "people" }],
    };
  }
  const youth = user?.role === "youth";
  return {
    main: [
      { href: youth ? "/app" : "/comecar", label: "Início", icon: "home", exact: true },
      { href: "/pausa", label: "Pausa", icon: "pause" },
      { href: "/desabafar", label: "Desabafar", icon: "chat", match: ["/desabafar", "/app/diario", "/app/conversa"] },
      { href: "/orientar", label: "Orientação", icon: "compass" },
      { href: "/conectar", label: "Apoio", icon: "people", match: ["/conectar", "/app/pedidos"] },
    ],
    extra: youth
      ? [
          { href: "/app/linha-do-tempo", label: "Linha do tempo", icon: "evidence" },
          { href: "/app/plano", label: "Plano de passos", icon: "check" },
          { href: "/app/denuncia", label: "Rascunho de denúncia", icon: "flag" },
          { href: "/app/diario", label: "Meu diário", icon: "book" },
          { href: "/app/conversa", label: "Conversa com IA", icon: "chat" },
          { href: "/app/pedidos", label: "Pedidos de apoio", icon: "inbox" },
          { href: "/app/conta", label: "Minha conta", icon: "settings" },
        ]
      : [{ href: "/sobre", label: "Sobre o projeto", icon: "info" }],
  };
}

export async function AppShell({ section, children }: { section: Section; children: ReactNode }) {
  const user = await getCurrentUser();
  const { main, extra } = navFor(section, user);
  const areaLabel = section === "pro" ? "Área do profissional" : section === "admin" ? "Administração" : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Pular para o conteúdo
      </a>
      <div className="flex flex-1">
        {/* Navegação lateral — computador */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-nevoa/70 px-4 py-6 lg:flex">
          <div className="px-2">
            <Logo href={user?.role === "youth" ? "/app" : "/"} />
            {areaLabel ? <p className="mt-2 text-sm text-muted">{areaLabel}</p> : null}
          </div>
          <div className="mt-8 flex-1 overflow-y-auto">
            <SideNav items={main} label="Navegação principal" />
            {extra.length ? (
              <div className="mt-6 border-t border-line pt-4">
                {section === "jornada" && user?.role === "youth" ? (
                  <p className="px-3 pb-2 text-sm font-semibold text-muted">Minha área</p>
                ) : null}
                <SideNav items={extra} label="Minha área" />
              </div>
            ) : null}
          </div>
          <AccountBlock user={user} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topo — computador: só a ajuda, discreta e sempre à mão */}
          <div className="pointer-events-none sticky top-0 z-30 hidden justify-end px-10 pt-5 lg:flex">
            <div className="pointer-events-auto rounded-full shadow-[0_6px_20px_-8px_rgb(39_36_59/0.35)]">
              <HelpMenu />
            </div>
          </div>
          {/* Barra superior — celular */}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-papel/90 px-4 py-3 backdrop-blur-md lg:hidden">
            <Logo size="sm" href={user?.role === "youth" ? "/app" : "/"} />
            <div className="flex items-center gap-2">
            <HelpMenu compact />
            {user ? (
              <Link
                href={user.role === "youth" ? "/app/conta" : user.role === "professional" ? "/pro/perfil" : "/admin"}
                className="flex min-h-11 items-center gap-2 rounded-full bg-nevoa px-3 text-sm font-semibold text-grafite"
              >
                <Icon name="user" className="h-5 w-5" />
                <span className="max-w-[9rem] truncate">{user.displayName}</span>
              </Link>
            ) : (
              <Link href="/entrar" className="flex min-h-11 items-center rounded-full bg-nevoa px-4 text-sm font-semibold text-iris">
                Entrar
              </Link>
            )}
            </div>
          </header>
          <main id="conteudo" className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:-mt-11 lg:px-10 lg:pb-12 lg:pt-10">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
          <footer className="hidden border-t border-line px-10 py-4 text-sm text-muted lg:block">
            Vunimo · Projeto em desenvolvimento. Não substitui atendimento profissional.
          </footer>
        </div>
      </div>
      <TabBar items={main} label="Navegação principal" />
    </div>
  );
}

function AccountBlock({ user }: { user: CurrentUser | null }) {
  if (!user) {
    return (
      <div className="mt-6 grid gap-2 border-t border-line pt-4">
        <Link href="/entrar" className="btn btn-secondary w-full">
          Entrar
        </Link>
        <Link href="/cadastro" className="text-center text-sm font-semibold text-iris underline underline-offset-2">
          Criar conta
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-6 border-t border-line pt-4">
      <p className="px-3 text-sm text-muted">Conectado como</p>
      <p className="truncate px-3 font-semibold">{user.displayName}</p>
      <form action={logout} className="mt-2">
        <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-grafite hover:bg-white/60">
          <Icon name="logout" className="h-5 w-5" />
          Sair
        </button>
      </form>
    </div>
  );
}
