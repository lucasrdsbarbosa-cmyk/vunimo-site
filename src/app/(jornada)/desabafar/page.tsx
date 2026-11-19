import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { Icon } from "@/components/Icons";
import { TrackVisit } from "@/components/TrackVisit";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Desabafar" };

export default async function VentPage() {
  const user = await getCurrentUser();
  const youth = user?.role === "youth";
  const go = (path: string) => (youth ? path : `/cadastro?next=${encodeURIComponent(path)}`);

  return (
    <div>
      <TrackVisit path="/desabafar" />
      <PageTitle title="Desabafar" subtitle="Escolha como quer se expressar. Comece por onde fizer sentido." />

      <div className="grid gap-4 md:grid-cols-2">
        <article className="flex flex-col rounded-[var(--radius-card)] border border-line bg-white p-6 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nevoa text-iris">
            <Icon name="book" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-2xl">Meu diário</h2>
          <p className="mt-2 flex-1 text-muted">
            Um espaço só seu para colocar em palavras o que aconteceu e como você se sente. Ninguém mais lê — nem a
            equipe, nem profissionais.
          </p>
          <Link href={go("/app/diario")} className="btn btn-primary mt-6">
            Escrever no diário
          </Link>
        </article>

        <article className="flex flex-col rounded-[var(--radius-card)] border border-line bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nevoa text-iris">
              <Icon name="chat" className="h-6 w-6" />
            </span>
            <span className="rounded-full bg-nevoa px-3 py-1 text-sm font-semibold text-iris">IA</span>
          </div>
          <h2 className="mt-4 text-2xl">Conversa com IA</h2>
          <p className="mt-2 flex-1 text-muted">
            É uma conversa com inteligência artificial, não com uma pessoa e não é atendimento profissional. Ela ajuda
            a organizar o que aconteceu e sugere próximos passos.
          </p>
          <Link href={go("/app/conversa")} className="btn btn-secondary mt-6">
            Conversar com a IA
          </Link>
        </article>
      </div>

      {!youth ? (
        <p className="mt-6 rounded-xl bg-nevoa px-4 py-3">
          O diário e a conversa ficam salvos na sua conta, por isso pedimos um cadastro rápido.{" "}
          <Link href="/entrar?next=/desabafar" className="link">
            Já tenho conta
          </Link>
        </p>
      ) : null}
    </div>
  );
}
