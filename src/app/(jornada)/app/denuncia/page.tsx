import type { Metadata } from "next";
import Link from "next/link";
import { getMyDraft, listMyDrafts, listMyTimeline } from "@/lib/dal-tools";
import { createDraft, deleteDraft } from "@/app/actions/tools";
import { RECIPIENTS } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { TrackVisit } from "@/components/TrackVisit";
import { ConfirmSubmit, SubmitButton } from "@/components/Form";
import { DraftEditor } from "./DraftEditor";

export const metadata: Metadata = { title: "Rascunho de denúncia" };

const HOW_TO_SEND: Record<string, string> = {
  plataforma: "Abra o perfil ou a mensagem, toque em Denunciar e cole o texto no campo de detalhes, se houver.",
  escola: "Envie à coordenação por e-mail ou leve impresso. Se puder, vá com um adulto de confiança.",
  responsavel: "Pode mandar por mensagem ou mostrar no celular numa conversa tranquila.",
  safernet: "Use o canal de ajuda ou o formulário de denúncia da SaferNet e cole o texto.",
};

export default async function ReportPage({ searchParams }: PageProps<"/app/denuncia">) {
  const params = await searchParams;
  const selectedId = typeof params.rascunho === "string" ? params.rascunho : null;
  const [drafts, selected, events] = await Promise.all([
    listMyDrafts(),
    selectedId ? getMyDraft(selectedId) : Promise.resolve(null),
    listMyTimeline(),
  ]);

  return (
    <div>
      <TrackVisit path="/app/denuncia" />
      <PageTitle
        title="Rascunho de denúncia"
        subtitle="Monte um texto claro a partir da sua linha do tempo. Você revisa, decide e envia quando quiser."
        back={{ href: "/app", label: "Minha área" }}
      />
      <div className="mb-6 grid gap-3">
        {params.novo ? <Notice>Rascunho criado com os registros da sua linha do tempo. Revise com calma.</Notice> : null}
        {params.apagado ? <Notice>Rascunho apagado.</Notice> : null}
        {params.erro || (selectedId && !selected) ? <Notice tone="error">Não encontramos esse rascunho.</Notice> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[19rem_1fr]">
        <aside className="grid h-fit gap-4">
          <section aria-labelledby="novo-rascunho" className="rounded-[var(--radius-card)] bg-nevoa p-5">
            <h2 id="novo-rascunho" className="text-lg">
              Novo rascunho
            </h2>
            <p className="mt-1 text-sm text-muted">
              {events.length > 0
                ? `Vamos usar os ${events.length} registros da sua linha do tempo.`
                : "Sua linha do tempo está vazia — o rascunho vem com espaços para preencher."}
            </p>
            <form action={createDraft} className="mt-4 grid gap-3">
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-semibold">Para quem?</legend>
                {Object.entries(RECIPIENTS).map(([value, label], i) => (
                  <label key={value} className="vn-chip w-full justify-start">
                    <input type="radio" name="recipient" value={value} defaultChecked={i === 0} />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <SubmitButton pendingLabel="Criando…">Criar rascunho</SubmitButton>
            </form>
            {events.length === 0 ? (
              <Link href="/app/linha-do-tempo" className="link mt-3 inline-block text-sm">
                Preencher a linha do tempo antes
              </Link>
            ) : null}
          </section>

          {drafts.length > 0 ? (
            <section aria-labelledby="meus-rascunhos" className="rounded-[var(--radius-card)] bg-white p-4">
              <h2 id="meus-rascunhos" className="px-1 text-lg">
                Meus rascunhos
              </h2>
              <ul className="mt-2 grid gap-1">
                {drafts.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/app/denuncia?rascunho=${d.id}`}
                      aria-current={selected?.id === d.id ? "page" : undefined}
                      className={`block rounded-xl px-3 py-2.5 ${selected?.id === d.id ? "bg-nevoa font-semibold text-iris" : "hover:bg-nevoa/60"}`}
                    >
                      <span className="block truncate">{d.title}</span>
                      <span className="text-sm font-normal text-muted">{formatDate(d.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>

        <section aria-label="Editor do rascunho" className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
          {selected ? (
            <>
              <p className="mb-4 rounded-xl bg-nevoa px-4 py-3 text-[0.95rem]">
                <span className="font-semibold">Como enviar: </span>
                {HOW_TO_SEND[selected.recipient]}
              </p>
              <DraftEditor key={selected.id} id={selected.id} title={selected.title} body={selected.body} />
              <form action={deleteDraft} className="mt-6 border-t border-line pt-5">
                <input type="hidden" name="id" value={selected.id} />
                <ConfirmSubmit confirmText="Apagar este rascunho? Não dá para desfazer.">Apagar rascunho</ConfirmSubmit>
              </form>
            </>
          ) : (
            <div className="grid min-h-64 place-content-center text-center">
              <p className="text-lg font-semibold">Escolha um rascunho ou crie um novo.</p>
              <p className="mt-1 max-w-md text-muted">
                O texto começa com os fatos da sua linha do tempo. A IA pode ajudar a deixar mais claro — sem inventar
                nada — e você sempre revisa antes.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
