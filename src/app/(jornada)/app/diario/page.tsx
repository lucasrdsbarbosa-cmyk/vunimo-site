import type { Metadata } from "next";
import Link from "next/link";
import { getMyJournalEntry, listMyJournal } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { deleteJournal } from "@/app/actions/youth";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { Icon } from "@/components/Icons";
import { TrackVisit } from "@/components/TrackVisit";
import { ConfirmSubmit } from "@/components/Form";
import { JournalForm } from "./JournalForm";

export const metadata: Metadata = { title: "Meu diário" };

export default async function JournalPage({ searchParams }: PageProps<"/app/diario">) {
  const params = await searchParams;
  const selectedId = typeof params.registro === "string" ? params.registro : null;
  const [entries, selected] = await Promise.all([
    listMyJournal(),
    selectedId ? getMyJournalEntry(selectedId) : Promise.resolve(null),
  ]);
  const notFound = selectedId && !selected;

  return (
    <div>
      <TrackVisit path="/app/diario" />
      <PageTitle
        title="Meu diário"
        subtitle="Um espaço para colocar em palavras."
        back={{ href: "/desabafar", label: "Desabafar" }}
      />
      <div className="mb-6 grid gap-3">
        {params.salvo ? <Notice>Registro salvo.</Notice> : null}
        {params.apagado ? <Notice>Registro apagado.</Notice> : null}
        {notFound || params.erro ? (
          <Notice tone="error">Não encontramos esse registro. Ele pode ter sido apagado.</Notice>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside aria-labelledby="registros" className="h-fit rounded-[var(--radius-card)] bg-nevoa p-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <h2 id="registros" className="text-lg">
              Registros
            </h2>
            {selected ? (
              <Link href="/app/diario" className="text-sm font-semibold text-iris underline underline-offset-2">
                Novo registro
              </Link>
            ) : null}
          </div>
          {entries.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-5 text-center">
              <Icon name="book" className="mx-auto h-8 w-8 text-iris" />
              <p className="mt-2 font-semibold">Seu diário começa por aqui.</p>
              <p className="text-sm text-muted">Quando quiser escrever, use o espaço ao lado.</p>
            </div>
          ) : (
            <ul className="mt-3 grid max-h-[28rem] gap-2 overflow-y-auto">
              {entries.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/app/diario?registro=${e.id}`}
                    aria-current={selected?.id === e.id ? "page" : undefined}
                    className={`block rounded-xl px-3 py-2.5 ${
                      selected?.id === e.id ? "bg-white font-semibold text-iris" : "hover:bg-white/70"
                    }`}
                  >
                    <span className="block truncate">{e.title || e.body.slice(0, 40)}</span>
                    <span className="text-sm font-normal text-muted">{formatDate(e.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section aria-label={selected ? "Editar registro" : "Novo registro"} className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
          <h2 className="mb-5 text-2xl">{selected ? "Editar registro" : "Escreva no seu tempo"}</h2>
          <JournalForm key={selected?.id ?? "novo"} entry={selected ?? undefined} />
          {selected ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-nevoa p-4">
              <Icon name="chat" className="h-6 w-6 shrink-0 text-iris" />
              <p className="min-w-0 flex-1 text-[0.95rem]">
                Quer pensar sobre isso com alguém? A IA lê só o que você enviar.
              </p>
              <Link href={`/app/conversa?diario=${selected.id}`} className="btn btn-primary vn-press min-h-11 px-5">
                Conversar com a IA sobre isto
              </Link>
            </div>
          ) : null}
          {selected ? (
            <form action={deleteJournal} className="mt-6 border-t border-line pt-5">
              <input type="hidden" name="id" value={selected.id} />
              <ConfirmSubmit confirmText="Apagar este registro do diário? Não dá para desfazer.">
                Apagar este registro
              </ConfirmSubmit>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}
