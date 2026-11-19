import "server-only";
import { db, newId, now } from "./db";
import { requireUser } from "./dal";
import { buildPlan, type PlanAnswers, type PlanStep } from "./plan";

/**
 * Ferramentas do jovem: linha do tempo, plano e rascunhos de denúncia.
 * Mesma regra de dal.ts: o dono sempre vem da sessão e toda consulta filtra por ele.
 * Profissionais e administração não têm nenhuma função de leitura aqui.
 */

// ---------- Linha do tempo ----------

export type TimelineEvent = {
  id: string;
  happenedOn: string;
  happenedTime: string;
  platform: string;
  kind: string;
  description: string;
  people: string;
  hasEvidence: boolean;
  evidenceNote: string;
};

function toEvent(r: Record<string, unknown>): TimelineEvent {
  return {
    id: r.id as string,
    happenedOn: r.happened_on as string,
    happenedTime: r.happened_time as string,
    platform: r.platform as string,
    kind: r.kind as string,
    description: r.description as string,
    people: r.people as string,
    hasEvidence: r.has_evidence === 1,
    evidenceNote: r.evidence_note as string,
  };
}

export async function listMyTimeline(): Promise<TimelineEvent[]> {
  const user = await requireUser(["youth"], "/app/linha-do-tempo");
  return (
    db()
      .prepare(
        "SELECT * FROM timeline_events WHERE user_id = ? ORDER BY happened_on ASC, happened_time ASC, created_at ASC",
      )
      .all(user.id) as Record<string, unknown>[]
  ).map(toEvent);
}

export async function getMyTimelineEvent(id: string): Promise<TimelineEvent | null> {
  const user = await requireUser(["youth"], "/app/linha-do-tempo");
  const r = db().prepare("SELECT * FROM timeline_events WHERE id = ? AND user_id = ?").get(id, user.id) as
    | Record<string, unknown>
    | undefined;
  return r ? toEvent(r) : null;
}

export type TimelineInput = Omit<TimelineEvent, "id">;

export async function saveMyTimelineEvent(id: string | null, e: TimelineInput): Promise<string | null> {
  const user = await requireUser(["youth"], "/app/linha-do-tempo");
  const values = [e.happenedOn, e.happenedTime, e.platform, e.kind, e.description, e.people, e.hasEvidence ? 1 : 0, e.evidenceNote];
  if (id) {
    const res = db()
      .prepare(
        `UPDATE timeline_events SET happened_on = ?, happened_time = ?, platform = ?, kind = ?, description = ?,
           people = ?, has_evidence = ?, evidence_note = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      )
      .run(...values, now(), id, user.id);
    return res.changes ? id : null;
  }
  const newEventId = newId();
  db()
    .prepare(
      `INSERT INTO timeline_events (id, user_id, happened_on, happened_time, platform, kind, description, people,
         has_evidence, evidence_note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(newEventId, user.id, ...values, now(), now());
  return newEventId;
}

export async function deleteMyTimelineEvent(id: string): Promise<boolean> {
  const user = await requireUser(["youth"], "/app/linha-do-tempo");
  return db().prepare("DELETE FROM timeline_events WHERE id = ? AND user_id = ?").run(id, user.id).changes > 0;
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
export function formatDay(isoDay: string): string {
  return dateFmt.format(new Date(`${isoDay}T00:00:00Z`));
}

/**
 * Resumo enviado a um profissional quando o jovem escolhe anexar.
 * Não inclui nomes de usuário de terceiros nem as notas sobre onde as provas estão guardadas.
 */
export function timelineSummary(events: TimelineEvent[]): string {
  if (events.length === 0) return "";
  const lines = events.map(
    (e) =>
      `• ${formatDay(e.happenedOn)}${e.happenedTime ? ` ${e.happenedTime}` : ""} — ${e.platform} — ${e.kind}: ${e.description}${
        e.hasEvidence ? " (tem print/registro)" : ""
      }`,
  );
  return `Resumo da linha do tempo (${events.length} ${events.length === 1 ? "registro" : "registros"}):\n${lines.join("\n")}`;
}

// ---------- Plano de próximos passos ----------

export type MyPlan = { answers: PlanAnswers; steps: PlanStep[]; done: string[] };

export async function getMyPlan(): Promise<MyPlan | null> {
  const user = await requireUser(["youth"], "/app/plano");
  const r = db().prepare("SELECT answers, done FROM action_plans WHERE user_id = ?").get(user.id) as
    | { answers: string; done: string }
    | undefined;
  if (!r) return null;
  const answers = JSON.parse(r.answers) as PlanAnswers;
  const steps = buildPlan(answers);
  const valid = new Set(steps.map((s) => s.id));
  return { answers, steps, done: (JSON.parse(r.done) as string[]).filter((d) => valid.has(d)) };
}

export async function saveMyPlanAnswers(answers: PlanAnswers): Promise<void> {
  const user = await requireUser(["youth"], "/app/plano");
  db()
    .prepare(
      `INSERT INTO action_plans (user_id, answers, done, updated_at) VALUES (?, ?, '[]', ?)
       ON CONFLICT(user_id) DO UPDATE SET answers = excluded.answers, updated_at = excluded.updated_at`,
    )
    .run(user.id, JSON.stringify(answers), now());
}

export async function toggleMyPlanStep(stepId: string, done: boolean): Promise<boolean> {
  const plan = await getMyPlan();
  if (!plan || !plan.steps.some((s) => s.id === stepId)) return false;
  const user = await requireUser(["youth"], "/app/plano");
  const set = new Set(plan.done);
  if (done) set.add(stepId);
  else set.delete(stepId);
  db()
    .prepare("UPDATE action_plans SET done = ?, updated_at = ? WHERE user_id = ?")
    .run(JSON.stringify([...set]), now(), user.id);
  return true;
}

export async function deleteMyPlan(): Promise<void> {
  const user = await requireUser(["youth"], "/app/plano");
  db().prepare("DELETE FROM action_plans WHERE user_id = ?").run(user.id);
}

// ---------- Rascunhos de denúncia ----------

export type Recipient = "plataforma" | "escola" | "responsavel" | "safernet";
export type ReportDraft = { id: string; recipient: Recipient; title: string; body: string; updatedAt: number };

function toDraft(r: Record<string, unknown>): ReportDraft {
  return {
    id: r.id as string,
    recipient: r.recipient as Recipient,
    title: r.title as string,
    body: r.body as string,
    updatedAt: r.updated_at as number,
  };
}

export async function listMyDrafts(): Promise<ReportDraft[]> {
  const user = await requireUser(["youth"], "/app/denuncia");
  return (
    db().prepare("SELECT * FROM report_drafts WHERE user_id = ? ORDER BY updated_at DESC").all(user.id) as Record<string, unknown>[]
  ).map(toDraft);
}

export async function getMyDraft(id: string): Promise<ReportDraft | null> {
  const user = await requireUser(["youth"], "/app/denuncia");
  const r = db().prepare("SELECT * FROM report_drafts WHERE id = ? AND user_id = ?").get(id, user.id) as
    | Record<string, unknown>
    | undefined;
  return r ? toDraft(r) : null;
}

export async function createMyDraft(recipient: Recipient, title: string, body: string): Promise<string> {
  const user = await requireUser(["youth"], "/app/denuncia");
  const id = newId();
  db()
    .prepare("INSERT INTO report_drafts (id, user_id, recipient, title, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, user.id, recipient, title, body, now(), now());
  return id;
}

export async function updateMyDraft(id: string, title: string, body: string): Promise<boolean> {
  const user = await requireUser(["youth"], "/app/denuncia");
  return (
    db()
      .prepare("UPDATE report_drafts SET title = ?, body = ?, updated_at = ? WHERE id = ? AND user_id = ?")
      .run(title, body, now(), id, user.id).changes > 0
  );
}

export async function deleteMyDraft(id: string): Promise<boolean> {
  const user = await requireUser(["youth"], "/app/denuncia");
  return db().prepare("DELETE FROM report_drafts WHERE id = ? AND user_id = ?").run(id, user.id).changes > 0;
}

/** Rascunho inicial montado a partir da linha do tempo, sem IA. */
export function draftTemplate(recipient: Recipient, events: TimelineEvent[], nickname: string): string {
  const facts = events.length
    ? events
        .map(
          (e) =>
            `- ${formatDay(e.happenedOn)}${e.happenedTime ? `, ${e.happenedTime}` : ""}, no ${e.platform}: ${e.kind.toLowerCase()}. ${e.description}${
              e.people ? ` Conta(s) envolvida(s): ${e.people}.` : ""
            }${e.hasEvidence ? " Tenho print/registro." : ""}`,
        )
        .join("\n")
    : "- [Descreva aqui o que aconteceu, com data, onde e quem.]";
  const intro: Record<Recipient, string> = {
    plataforma:
      "Quero denunciar uma conta/conteúdo que está me atacando e viola as regras da comunidade. Seguem os fatos:",
    escola:
      "Venho pedir ajuda da escola. Estou sofrendo ciberbullying, que envolve pessoas da escola. Seguem os fatos:",
    responsavel:
      "Queria te contar uma coisa que está acontecendo comigo na internet e pedir sua ajuda. Organizei o que aconteceu:",
    safernet:
      "Gostaria de orientação sobre um caso de violência online que estou sofrendo. Seguem os fatos:",
  };
  const ask: Record<Recipient, string> = {
    plataforma: "Peço que analisem e removam o conteúdo e as contas envolvidas.",
    escola: "Peço que a escola acompanhe o caso e me ajude a resolver com segurança.",
    responsavel: "Preciso de você para pensar no próximo passo comigo.",
    safernet: "Quero saber quais caminhos posso seguir e como me proteger.",
  };
  const greeting = recipient === "responsavel" ? "Oi," : "Olá,";
  return `${greeting}\n\n${intro[recipient]}\n\n${facts}\n\n${ask[recipient]}\n\n${recipient === "plataforma" ? "Obrigado(a)." : `Obrigado(a),\n${nickname}`}`;
}

// ---------- Resumo para o painel ----------

export async function getMyToolsSummary() {
  const user = await requireUser(["youth"], "/app");
  const d = db();
  const timeline = d.prepare("SELECT COUNT(*) AS n, MAX(updated_at) AS last FROM timeline_events WHERE user_id = ?").get(user.id) as {
    n: number;
    last: number | null;
  };
  const drafts = d.prepare("SELECT COUNT(*) AS n, MAX(updated_at) AS last FROM report_drafts WHERE user_id = ?").get(user.id) as {
    n: number;
    last: number | null;
  };
  const plan = await getMyPlan();
  return {
    timeline,
    drafts,
    plan: plan ? { total: plan.steps.length, done: plan.done.length, next: plan.steps.find((s) => !plan.done.includes(s.id)) ?? null } : null,
  };
}
