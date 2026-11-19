import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { Icon } from "@/components/Icons";
import { TrackVisit } from "@/components/TrackVisit";
import { VunimoSymbol } from "@/components/Logo";
import { UrgentHelp } from "@/components/UrgentHelp";
import { MODALITY_LABEL, SUPPORT_CHANNELS } from "@/lib/content";
import { listApprovedProfessionals } from "@/lib/dal";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Apoio" };

export default async function SupportPage() {
  const [user, professionals] = await Promise.all([getCurrentUser(), Promise.resolve(listApprovedProfessionals())]);
  const youth = user?.role === "youth";
  const requestHref = (id: string) =>
    youth ? `/app/pedidos?profissional=${id}` : `/cadastro?next=${encodeURIComponent(`/app/pedidos?profissional=${id}`)}`;

  return (
    <div className="grid gap-12">
      <TrackVisit path="/conectar" />
      <PageTitle title="Encontre um caminho de apoio" subtitle="Canais de ajuda e profissionais que participam da Vunimo." />

      <UrgentHelp tone="card" />

      <section aria-labelledby="canais-titulo" id="canais" className="scroll-mt-6">
        <h2 id="canais-titulo" className="text-2xl">
          Canais de apoio
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {SUPPORT_CHANNELS.map((c) => (
            <li key={c.name} className="rounded-[var(--radius-card)] border border-line bg-white p-5">
              <h3 className="text-lg">{c.name}</h3>
              <p className="mt-1 text-muted">{c.detail}</p>
              {c.href ? (
                <a
                  href={c.href}
                  className="link mt-3 inline-flex min-h-11 items-center"
                  {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {c.contact}
                </a>
              ) : (
                <p className="mt-3 font-semibold">{c.contact}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="profissionais">
        <h2 id="profissionais" className="text-2xl">
          Profissionais de saúde
        </h2>
        <p className="mt-1 max-w-2xl text-muted">
          Registros conferidos pela equipe da Vunimo. Você pode enviar um pedido e receber uma orientação por aqui. A
          resposta não é imediata e não substitui atendimento de emergência.
        </p>
        {professionals.length === 0 ? (
          <p className="mt-4 rounded-xl bg-nevoa px-4 py-3">
            Ainda não há profissionais disponíveis. Enquanto isso, use os canais de apoio acima.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {professionals.map((p) => (
              <li key={p.id} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-white p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-nevoa text-lg font-semibold text-iris">
                    {p.fullName.charAt(0)}
                  </span>
                  <div>
                    <h3 className="text-lg">{p.fullName}</h3>
                    <p className="text-muted">
                      {p.profession} · {p.registry}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-grafite/85">{p.bio}</p>
                <dl className="mt-4 grid gap-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="font-semibold">Atende:</dt>
                    <dd>
                      {MODALITY_LABEL[p.modality]}
                      {p.city ? ` · ${p.city}` : ""}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-semibold">Experiência:</dt>
                    <dd>{p.specialties}</dd>
                  </div>
                </dl>
                {user && user.role !== "youth" ? null : (
                  <Link href={requestHref(p.id)} className="btn btn-secondary mt-5">
                    Pedir apoio a {p.fullName.split(" ")[0]}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mural" className="grid items-center gap-6 rounded-[var(--radius-card)] bg-white p-6 sm:p-8 md:grid-cols-[auto_1fr]">
        <span className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-nevoa">
          <VunimoSymbol variant="lima" className="h-16 w-16 [&_path]:stroke-[#b9d24a]" />
        </span>
        <div>
          <span className="inline-flex rounded-full border border-iris px-3 py-0.5 text-sm font-semibold text-iris">
            Conceito
          </span>
          <h2 id="mural" className="mt-2 text-2xl">
            Mural de apoio
          </h2>
          <p className="mt-1 text-muted">
            Uma proposta de espaço para compartilhar apoio e dicas de convivência. Ainda está em estudo: as regras e a
            moderação precisam ser definidas antes de abrir. Sem publicações nesta demonstração.
          </p>
        </div>
      </section>

      {!youth && !user ? (
        <p className="flex items-start gap-2 text-muted">
          <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-iris" />
          Para enviar um pedido a um profissional, é preciso ter conta — assim só você e ele veem a conversa.
        </p>
      ) : null}
    </div>
  );
}
