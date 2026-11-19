import type { Metadata } from "next";
import Link from "next/link";
import { cancelRequest } from "@/app/actions/youth";
import { listApprovedProfessionals, listMyRequests } from "@/lib/dal";
import { listMyTimeline } from "@/lib/dal-tools";
import { formatDate, STATUS_LABEL } from "@/lib/format";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { TrackVisit } from "@/components/TrackVisit";
import { ConfirmSubmit } from "@/components/Form";
import { RequestForm } from "./RequestForm";

export const metadata: Metadata = { title: "Pedidos de apoio" };

const STATUS_STYLE: Record<string, string> = {
  open: "bg-nevoa text-iris",
  accepted: "bg-lima text-grafite",
  closed: "bg-line text-grafite",
  cancelled: "bg-line text-muted",
};

export default async function RequestsPage({ searchParams }: PageProps<"/app/pedidos">) {
  const [requests, params, timeline] = await Promise.all([listMyRequests(), searchParams, listMyTimeline()]);
  const professionals = listApprovedProfessionals();
  const preselected = typeof params.profissional === "string" ? params.profissional : undefined;

  return (
    <div>
      <TrackVisit path="/app/pedidos" />
      <PageTitle
        title="Pedidos de apoio"
        subtitle="Peça orientação a um profissional de saúde da Vunimo."
        back={{ href: "/conectar", label: "Apoio" }}
      />
      <div className="mb-6 grid gap-3">
        {params.enviado ? (
          <Notice>Pedido enviado. Você vai ver a resposta aqui. Enquanto isso, a Pausa e a Orientação continuam disponíveis.</Notice>
        ) : null}
        {params.cancelado ? <Notice>Pedido cancelado.</Notice> : null}
        {params.erro ? <Notice tone="error">Esse pedido não pode mais ser cancelado.</Notice> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section aria-labelledby="meus-pedidos">
          <h2 id="meus-pedidos" className="text-2xl">
            Meus pedidos
          </h2>
          {requests.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-nevoa p-5">
              Você ainda não enviou nenhum pedido. Use o formulário para escrever para um profissional.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {requests.map((r) => (
                <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{r.counterpartName}</p>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted">
                    {r.topic} · enviado em {formatDate(r.createdAt)}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap">{r.message}</p>
                  {r.attachment ? (
                    <details className="vn-details mt-3 rounded-xl bg-nevoa/60 px-4 text-sm">
                      <summary className="font-semibold">Resumo anexado</summary>
                      <p className="whitespace-pre-wrap pb-3">{r.attachment}</p>
                    </details>
                  ) : null}
                  {r.response ? (
                    <div className="mt-4 rounded-2xl bg-nevoa p-4">
                      <p className="text-sm font-semibold text-iris">Resposta de {r.counterpartName.split(" ")[0]}</p>
                      <p className="mt-1 whitespace-pre-wrap">{r.response}</p>
                    </div>
                  ) : null}
                  {r.status === "open" ? (
                    <form action={cancelRequest} className="mt-4">
                      <input type="hidden" name="id" value={r.id} />
                      <ConfirmSubmit
                        confirmText="Cancelar este pedido? O profissional não vai mais vê-lo."
                        className="btn btn-danger min-h-11 px-4 text-sm"
                        pendingLabel="Cancelando…"
                      >
                        Cancelar pedido
                      </ConfirmSubmit>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="novo-pedido" className="h-fit rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
          <h2 id="novo-pedido" className="text-2xl">
            Novo pedido
          </h2>
          {professionals.length === 0 ? (
            <p className="mt-4">
              Ainda não há profissionais disponíveis. Veja os{" "}
              <Link href="/conectar#canais" className="link">
                canais de apoio
              </Link>
              .
            </p>
          ) : (
            <div className="mt-5">
              <RequestForm
                professionals={professionals.map((p) => ({ id: p.id, label: `${p.fullName} — ${p.profession}` }))}
                preselected={preselected}
                timelineCount={timeline.length}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
