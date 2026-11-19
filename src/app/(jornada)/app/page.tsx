import type { Metadata } from "next";
import Link from "next/link";
import { getMyDashboard } from "@/lib/dal";
import { getMyToolsSummary } from "@/lib/dal-tools";
import { formatDate } from "@/lib/format";
import { Icon, type IconName } from "@/components/Icons";
import { Notice } from "@/components/Notice";
import { NucleusCards } from "@/components/NucleusCards";

export const metadata: Metadata = { title: "Minha área" };

type Tool = { href: string; icon: IconName; title: string; status: string; fresh?: boolean };

export default async function YouthHome({ searchParams }: PageProps<"/app">) {
  const [data, tools, params] = await Promise.all([getMyDashboard(), getMyToolsSummary(), searchParams]);
  const { user, progress, lastEntry, conversation, requests } = data;

  const started = {
    pausa: progress !== null,
    timeline: tools.timeline.n > 0,
    plan: tools.plan !== null,
  };
  const firstSteps = [
    { done: started.pausa, href: "/pausa", title: "Respire um minuto", text: "Uma pausa antes de decidir qualquer coisa." },
    { done: started.timeline, href: "/app/linha-do-tempo", title: "Registre o que aconteceu", text: "Data, onde, o que e se tem print." },
    { done: started.plan, href: "/app/plano", title: "Monte seu plano", text: "Cinco perguntas viram um checklist." },
  ];
  const showStart = !(started.timeline && started.plan);
  const nextStart = firstSteps.find((s) => !s.done);

  const toolList: Tool[] = [
    {
      href: "/app/linha-do-tempo",
      icon: "evidence",
      title: "Linha do tempo",
      status: tools.timeline.n ? `${tools.timeline.n} ${tools.timeline.n === 1 ? "registro" : "registros"}` : "Organize o que aconteceu",
      fresh: true,
    },
    {
      href: "/app/plano",
      icon: "check",
      title: "Plano de próximos passos",
      status: tools.plan ? `${tools.plan.done} de ${tools.plan.total} passos feitos` : "Responda 5 perguntas",
      fresh: true,
    },
    {
      href: "/app/denuncia",
      icon: "flag",
      title: "Rascunho de denúncia",
      status: tools.drafts.n ? `${tools.drafts.n} ${tools.drafts.n === 1 ? "rascunho" : "rascunhos"}` : "Monte um texto claro",
      fresh: true,
    },
    {
      href: "/app/diario",
      icon: "book",
      title: "Meu diário",
      status: lastEntry ? `Último: ${lastEntry.title || "sem título"}` : "Escreva quando quiser",
    },
    {
      href: "/app/conversa",
      icon: "chat",
      title: "Conversa com IA",
      status: conversation ? `${conversation.count} mensagens · ${formatDate(conversation.updatedAt)}` : "Comece quando quiser",
    },
    {
      href: "/app/pedidos",
      icon: "inbox",
      title: "Pedidos de apoio",
      status: requests.answered ? `${requests.answered} com resposta` : requests.open ? `${requests.open} aguardando` : "Fale com um profissional",
    },
  ];

  return (
    <div className="grid gap-10">
      {params["boas-vindas"] ? <Notice>Conta criada. Que bom ter você aqui, {user.displayName}.</Notice> : null}
      {params.aviso === "sem-permissao" ? <Notice tone="error">Essa área não está disponível para a sua conta.</Notice> : null}

      <div>
        <p className="text-lg text-muted">Oi, {user.displayName}.</p>
        <h1 className="mt-1 text-[2.4rem] leading-tight sm:text-5xl">Como você quer seguir hoje?</h1>
      </div>

      {/* Retomar */}
      {progress || tools.plan?.next ? (
        <section aria-labelledby="retomar" className="grid gap-3 md:grid-cols-2">
          <h2 id="retomar" className="sr-only">
            Retomar
          </h2>
          {progress ? (
            <div className="on-iris flex flex-col justify-between gap-4 rounded-[var(--radius-card)] bg-iris p-6 text-white">
              <div>
                <p className="text-sm font-semibold text-lima">Continuar de onde parou</p>
                <p className="mt-1 text-2xl font-semibold">{progress.lastLabel}</p>
                <p className="text-white/80">Última visita em {formatDate(progress.updatedAt)}</p>
              </div>
              <Link href={progress.lastPath} className="btn btn-lima vn-press self-start">
                Continuar
                <Icon name="arrow" className="h-5 w-5" />
              </Link>
            </div>
          ) : null}
          {tools.plan?.next ? (
            <div className="flex flex-col justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-white p-6">
              <div>
                <p className="text-sm font-semibold text-iris">Próximo passo do seu plano</p>
                <p className="mt-1 text-xl font-semibold">{tools.plan.next.title}</p>
                <p className="mt-1 text-muted">{tools.plan.next.detail}</p>
              </div>
              <Link href="/app/plano" className="btn btn-secondary vn-press self-start">
                Abrir o plano
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Por onde começar */}
      {showStart ? (
        <section aria-labelledby="comecar" className="rounded-[var(--radius-card)] bg-nevoa p-6 sm:p-8">
          <h2 id="comecar" className="text-2xl">
            Por onde começar
          </h2>
          <p className="mt-1 text-muted">Acabou de acontecer? Estes três passos ajudam a organizar a cabeça.</p>
          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {firstSteps.map((s, i) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={`vn-card flex h-full items-start gap-3 rounded-2xl p-4 ${
                    s === nextStart ? "bg-white ring-2 ring-iris" : "bg-white/80"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold ${
                      s.done ? "bg-ok-bg text-ok" : "bg-iris text-white"
                    }`}
                  >
                    {s.done ? <Icon name="check" className="h-5 w-5" /> : i + 1}
                    <span className="sr-only">{s.done ? " (feito)" : ""}</span>
                  </span>
                  <span>
                    <span className="block font-semibold">{s.title}</span>
                    <span className="text-sm text-muted">{s.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Ferramentas */}
      <section aria-labelledby="ferramentas">
        <h2 id="ferramentas" className="text-2xl">
          Suas ferramentas
        </h2>
        <p className="mt-1 text-muted">Tudo aqui é privado. Só você vê.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {toolList.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="vn-card group flex h-full items-start gap-4 rounded-[var(--radius-card)] border border-line bg-white p-5 hover:border-iris">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.fresh ? "bg-lima" : "bg-nevoa text-iris"}`}>
                  <Icon name={t.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold">{t.title}</span>
                  <span className="block truncate text-muted">{t.status}</span>
                </span>
                <Icon name="arrow" className="mt-1 h-5 w-5 text-iris transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="caminhos">
        <h2 id="caminhos" className="text-2xl">
          Os quatro caminhos
        </h2>
        <p className="mb-4 mt-1 text-muted">Pausa, desabafo, orientação e apoio — a ordem é sua.</p>
        <NucleusCards />
      </section>
    </div>
  );
}
