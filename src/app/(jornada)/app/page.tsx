import type { Metadata } from "next";
import Link from "next/link";
import { getMyDashboard } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/Icons";
import { Notice } from "@/components/Notice";
import { NucleusCards } from "@/components/NucleusCards";

export const metadata: Metadata = { title: "Minha área" };

export default async function YouthHome({ searchParams }: PageProps<"/app">) {
  const [data, params] = await Promise.all([getMyDashboard(), searchParams]);
  const { user, progress, lastEntry, conversation, requests } = data;

  return (
    <div className="grid gap-10">
      {params["boas-vindas"] ? <Notice>Conta criada. Que bom ter você aqui, {user.displayName}.</Notice> : null}
      {params.aviso === "sem-permissao" ? (
        <Notice tone="error">Essa área não está disponível para a sua conta.</Notice>
      ) : null}

      <div>
        <p className="text-lg text-muted">Oi, {user.displayName}.</p>
        <h1 className="mt-1 text-[2.4rem] leading-tight sm:text-5xl">Como você quer seguir hoje?</h1>
      </div>

      {progress ? (
        <section aria-labelledby="continuar" className="on-iris grid gap-4 rounded-[var(--radius-card)] bg-iris p-6 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <h2 id="continuar" className="text-sm font-semibold text-lima">
              Continuar de onde parou
            </h2>
            <p className="mt-1 text-2xl font-semibold">{progress.lastLabel}</p>
            <p className="text-white/80">Última visita em {formatDate(progress.updatedAt)}</p>
          </div>
          <Link href={progress.lastPath} className="btn btn-lima">
            Continuar
            <Icon name="arrow" className="h-5 w-5" />
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="minhas-coisas">
        <h2 id="minhas-coisas" className="text-2xl">
          Suas coisas
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          <li>
            <Link href="/app/diario" className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-5 hover:border-iris">
              <Icon name="book" className="h-6 w-6 text-iris" />
              <span className="mt-3 text-lg font-semibold">Meu diário</span>
              <span className="text-muted">
                {lastEntry
                  ? `Último registro: ${lastEntry.title || "sem título"}, ${formatDate(lastEntry.updatedAt)}`
                  : "Nenhum registro ainda. Escreva quando quiser."}
              </span>
            </Link>
          </li>
          <li>
            <Link href="/app/conversa" className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-5 hover:border-iris">
              <Icon name="chat" className="h-6 w-6 text-iris" />
              <span className="mt-3 text-lg font-semibold">Conversa com IA</span>
              <span className="text-muted">
                {conversation
                  ? `${conversation.count} mensagens · ${formatDate(conversation.updatedAt)}`
                  : "Comece quando quiser."}
              </span>
            </Link>
          </li>
          <li>
            <Link href="/app/pedidos" className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-5 hover:border-iris">
              <Icon name="inbox" className="h-6 w-6 text-iris" />
              <span className="mt-3 text-lg font-semibold">Pedidos de apoio</span>
              <span className="text-muted">
                {requests.answered > 0
                  ? `${requests.answered} com resposta`
                  : requests.open > 0
                    ? `${requests.open} aguardando resposta`
                    : "Peça orientação a um profissional."}
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="caminhos">
        <h2 id="caminhos" className="text-2xl">
          Os quatro caminhos
        </h2>
        <p className="mb-4 mt-1 text-muted">Escolha por onde começar. A ordem é sua.</p>
        <NucleusCards />
      </section>
    </div>
  );
}
