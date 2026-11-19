import type { Metadata } from "next";
import Link from "next/link";
import { getMyProfessionalProfile, listRequestsForMe } from "@/lib/dal";
import { Notice } from "@/components/Notice";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = { title: "Painel do profissional" };

const STATUS_COPY = {
  pending: {
    badge: "Em análise",
    style: "bg-nevoa text-iris",
    title: "Recebemos seu cadastro",
    text: "A equipe vai conferir seu registro no conselho. Enquanto isso, seu perfil não aparece para os jovens e você ainda não recebe pedidos.",
  },
  approved: {
    badge: "Aprovado",
    style: "bg-lima text-grafite",
    title: "Seu perfil está no diretório",
    text: "Jovens podem ver sua apresentação no Apoio e enviar pedidos para você.",
  },
  rejected: {
    badge: "Não aprovado",
    style: "bg-alerta-bg text-alerta",
    title: "Não conseguimos aprovar seu cadastro",
    text: "Revise os dados do registro no seu perfil. Ao salvar mudanças no registro, o cadastro volta para análise.",
  },
} as const;

export default async function ProHome({ searchParams }: PageProps<"/pro">) {
  const [profile, params] = await Promise.all([getMyProfessionalProfile(), searchParams]);
  const copy = STATUS_COPY[profile.status];
  const requests = profile.status === "approved" ? await listRequestsForMe() : [];
  const open = requests.filter((r) => r.status === "open").length;

  return (
    <div className="grid gap-8">
      {params.cadastro ? <Notice>Cadastro enviado. Acompanhe a análise por aqui.</Notice> : null}
      {params.aviso === "aguardando-aprovacao" ? (
        <Notice tone="info">Os pedidos ficam disponíveis depois que seu cadastro for aprovado.</Notice>
      ) : null}
      {params.aviso === "sem-permissao" ? (
        <Notice tone="error">Essa área não está disponível para contas de profissional.</Notice>
      ) : null}

      <div>
        <p className="text-lg text-muted">Olá, {profile.fullName.split(" ")[0]}.</p>
        <h1 className="mt-1 text-[2.2rem] leading-tight sm:text-5xl">Painel do profissional</h1>
      </div>

      <section aria-labelledby="status" className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${copy.style}`}>{copy.badge}</span>
        <h2 id="status" className="mt-3 text-2xl">
          {copy.title}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{copy.text}</p>
        {profile.status === "rejected" && profile.reviewNote ? (
          <p className="mt-3 rounded-xl bg-nevoa px-4 py-3">
            <span className="font-semibold">Observação da equipe:</span> {profile.reviewNote}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {profile.status === "approved" ? (
            <Link href="/pro/pedidos" className="btn btn-primary">
              {open > 0 ? `Ver ${open} ${open === 1 ? "pedido novo" : "pedidos novos"}` : "Ver pedidos"}
            </Link>
          ) : null}
          <Link href="/pro/perfil" className="btn btn-secondary">
            {profile.status === "rejected" ? "Revisar meu perfil" : "Ver meu perfil"}
          </Link>
        </div>
      </section>

      <section aria-labelledby="como" className="rounded-[var(--radius-card)] bg-nevoa p-6 sm:p-8">
        <h2 id="como" className="text-xl">
          O que você vê — e o que não vê
        </h2>
        <ul className="mt-3 grid gap-2">
          <li className="flex gap-2">
            <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
            Os pedidos que um jovem escolheu enviar para você: apelido, assunto e mensagem.
          </li>
          <li className="flex gap-2">
            <Icon name="close" className="mt-0.5 h-5 w-5 shrink-0 text-alerta" />
            Diário, conversas com a IA, e-mail ou idade dos jovens.
          </li>
        </ul>
        <Link href="/profissionais#diretrizes" className="link mt-4 inline-block">
          Rever as diretrizes de participação
        </Link>
      </section>
    </div>
  );
}
