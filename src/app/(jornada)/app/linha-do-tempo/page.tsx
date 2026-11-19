import type { Metadata } from "next";
import Link from "next/link";
import { formatDay, getMyTimelineEvent, listMyTimeline } from "@/lib/dal-tools";
import { deleteTimelineEvent } from "@/app/actions/tools";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { Icon } from "@/components/Icons";
import { TrackVisit } from "@/components/TrackVisit";
import { ConfirmSubmit } from "@/components/Form";
import { TimelineForm } from "./TimelineForm";

export const metadata: Metadata = { title: "Linha do tempo" };

export default async function TimelinePage({ searchParams }: PageProps<"/app/linha-do-tempo">) {
  const params = await searchParams;
  const editId = typeof params.editar === "string" ? params.editar : null;
  const [events, editing] = await Promise.all([listMyTimeline(), editId ? getMyTimelineEvent(editId) : Promise.resolve(null)]);
  const today = new Date().toISOString().slice(0, 10);
  const withEvidence = events.filter((e) => e.hasEvidence).length;

  return (
    <div>
      <TrackVisit path="/app/linha-do-tempo" />
      <PageTitle
        title="Linha do tempo"
        subtitle="Organize o que aconteceu, um episódio de cada vez. Só você vê."
        back={{ href: "/app", label: "Minha área" }}
      />
      <div className="mb-6 grid gap-3">
        {params.salvo ? <Notice>Registro adicionado à linha do tempo.</Notice> : null}
        {params.atualizado ? <Notice>Registro atualizado.</Notice> : null}
        {params.apagado ? <Notice>Registro apagado.</Notice> : null}
        {params.erro || (editId && !editing) ? <Notice tone="error">Não encontramos esse registro.</Notice> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="registros">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="registros" className="text-2xl">
              {events.length === 0 ? "Nenhum registro ainda" : `${events.length} ${events.length === 1 ? "registro" : "registros"}`}
            </h2>
            {events.length > 0 ? (
              <p className="text-sm text-muted">
                {withEvidence} com print guardado
              </p>
            ) : null}
          </div>
          {events.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-nevoa p-6">
              <p className="font-semibold">Comece pelo episódio mais recente.</p>
              <p className="mt-1 text-muted">
                Ter tudo em ordem ajuda a pedir ajuda, denunciar e lembrar sem precisar reabrir as mensagens.
              </p>
            </div>
          ) : (
            <ol className="vn-timeline mt-5">
              {events.map((e) => (
                <li key={e.id} id={`r-${e.id}`} className="vn-timeline-item scroll-mt-24">
                  <span aria-hidden="true" className="vn-timeline-dot" data-evidence={e.hasEvidence ? "" : undefined} />
                  <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
                    <p className="text-sm font-semibold text-iris">
                      {formatDay(e.happenedOn)}
                      {e.happenedTime ? ` · ${e.happenedTime}` : ""} · {e.platform}
                    </p>
                    <h3 className="mt-1 text-lg">{e.kind}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-grafite/85">{e.description}</p>
                    {e.people ? <p className="mt-2 text-sm text-muted">Quem: {e.people}</p> : null}
                    <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${e.hasEvidence ? "bg-ok-bg text-ok" : "bg-alerta-bg text-alerta"}`}>
                      <Icon name={e.hasEvidence ? "check" : "info"} className="h-4 w-4" />
                      {e.hasEvidence ? `Print guardado${e.evidenceNote ? `: ${e.evidenceNote}` : ""}` : "Sem print ainda"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/app/linha-do-tempo?editar=${e.id}#editar`} className="btn btn-secondary vn-press min-h-11 px-4 text-sm">
                        Editar
                      </Link>
                      <form action={deleteTimelineEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <ConfirmSubmit confirmText="Apagar este registro da linha do tempo? Não dá para desfazer." className="btn btn-danger min-h-11 px-4 text-sm">
                          Apagar
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {events.length > 0 ? (
            <div className="mt-6 grid gap-2 rounded-2xl bg-nevoa p-5">
              <p className="font-semibold">E agora?</p>
              <Link href="/app/denuncia" className="link">
                Transformar em rascunho de denúncia
              </Link>
              <Link href="/app/pedidos" className="link">
                Pedir apoio e anexar um resumo
              </Link>
            </div>
          ) : null}
        </section>

        <section id="editar" aria-labelledby="novo" className="h-fit scroll-mt-24 rounded-[var(--radius-card)] bg-white p-6 sm:p-8 lg:sticky lg:top-20">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="novo" className="text-2xl">
              {editing ? "Editar registro" : "Novo registro"}
            </h2>
            {editing ? (
              <Link href="/app/linha-do-tempo" className="text-sm font-semibold text-iris underline underline-offset-2">
                Cancelar
              </Link>
            ) : null}
          </div>
          <TimelineForm key={editing?.id ?? "novo"} event={editing ?? undefined} today={today} />
        </section>
      </div>
    </div>
  );
}
