import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/Logo";
import { getCurrentUser, homeFor } from "@/lib/session";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const account = user ? { href: homeFor(user.role), label: "Minha área" } : null;
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Pular para o conteúdo
      </a>
      <SiteHeader account={account} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <footer className="bg-grafite text-white/85">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo variant="negative" />
            <p className="mt-3 max-w-sm text-sm">
              Apoio para a vida online. Projeto em desenvolvimento — não substitui atendimento profissional nem
              serviços de emergência.
            </p>
          </div>
          <nav aria-label="Rodapé: jornada">
            <p className="font-semibold text-white">Jornada</p>
            <ul className="mt-2 grid gap-1 text-sm">
              <li><Link className="hover:underline" href="/pausa">Pausa</Link></li>
              <li><Link className="hover:underline" href="/desabafar">Desabafar</Link></li>
              <li><Link className="hover:underline" href="/orientar">Orientação</Link></li>
              <li><Link className="hover:underline" href="/conectar">Apoio</Link></li>
            </ul>
          </nav>
          <nav aria-label="Rodapé: projeto">
            <p className="font-semibold text-white">Projeto</p>
            <ul className="mt-2 grid gap-1 text-sm">
              <li><Link className="hover:underline" href="/sobre">Sobre a Vunimo</Link></li>
              <li><Link className="hover:underline" href="/profissionais">Para profissionais</Link></li>
              <li><Link className="hover:underline" href="/privacidade">Privacidade</Link></li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
