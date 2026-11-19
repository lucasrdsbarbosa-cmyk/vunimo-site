import "server-only";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db, newId, now, transaction } from "./db";
import { getCurrentUser, homeFor, type CurrentUser, type Role } from "./session";

/**
 * Camada de acesso a dados. Regra de ouro: toda função que lê ou altera dados
 * privados obtém o usuário pela sessão (nunca por um id vindo do navegador) e
 * filtra pelo dono. As páginas e Server Actions só falam com o banco por aqui.
 */

// ---------- Autorização ----------

export async function requireUser(roles: Role[], nextPath = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(nextPath)}`);
  if (!roles.includes(user.role)) redirect(`${homeFor(user.role)}?aviso=sem-permissao`);
  return user;
}

// ---------- Contas ----------

type UserRow = { id: string; password_hash: string; role: Role };

export function emailInUse(email: string): boolean {
  return !!db().prepare("SELECT 1 FROM users WHERE email = ?").get(email);
}

export async function createYouth(input: {
  email: string;
  password: string;
  displayName: string;
  birthYear: number;
}): Promise<string> {
  const id = newId();
  const hash = await bcrypt.hash(input.password, 12);
  db()
    .prepare(
      `INSERT INTO users (id, email, password_hash, role, display_name, birth_year, created_at)
       VALUES (?, ?, ?, 'youth', ?, ?, ?)`,
    )
    .run(id, input.email, hash, input.displayName, input.birthYear, now());
  return id;
}

export type ProfileInput = {
  fullName: string;
  profession: string;
  registryNumber: string;
  registryState: string;
  modality: "online" | "presencial" | "ambos";
  city: string;
  specialties: string;
  bio: string;
};

export async function createProfessional(
  input: ProfileInput & { email: string; password: string },
): Promise<string> {
  const id = newId();
  const hash = await bcrypt.hash(input.password, 12);
  const firstName = input.fullName.split(/\s+/)[0];
  transaction(() => {
    db()
      .prepare(
        `INSERT INTO users (id, email, password_hash, role, display_name, created_at)
         VALUES (?, ?, ?, 'professional', ?, ?)`,
      )
      .run(id, input.email, hash, firstName, now());
    db()
      .prepare(
        `INSERT INTO professional_profiles
         (user_id, full_name, profession, registry_number, registry_state, specialties, bio, modality, city, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id, input.fullName, input.profession, input.registryNumber, input.registryState,
        input.specialties, input.bio, input.modality, input.city, now(),
      );
  });
  return id;
}

// Hash fixo para gastar o mesmo tempo quando o e-mail não existe.
const DUMMY_HASH = bcrypt.hashSync("vunimo-dummy-password", 12);

export async function verifyLogin(email: string, password: string): Promise<UserRow | null> {
  const row = db()
    .prepare("SELECT id, password_hash, role FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;
  const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  return row && ok ? row : null;
}

export async function updateMyDisplayName(displayName: string): Promise<void> {
  const user = await requireUser(["youth", "professional", "admin"]);
  db().prepare("UPDATE users SET display_name = ? WHERE id = ?").run(displayName, user.id);
}

export async function deleteMyAccount(): Promise<void> {
  const user = await requireUser(["youth", "professional"]);
  // ON DELETE CASCADE apaga diário, conversas, progresso, pedidos e sessões.
  db().prepare("DELETE FROM users WHERE id = ?").run(user.id);
}

// ---------- Progresso (jovem) ----------

export type Progress = { lastPath: string; lastLabel: string; updatedAt: number };

export async function getMyProgress(): Promise<Progress | null> {
  const user = await requireUser(["youth"]);
  const row = db()
    .prepare("SELECT last_path, last_label, updated_at FROM progress WHERE user_id = ?")
    .get(user.id) as { last_path: string; last_label: string; updated_at: number } | undefined;
  return row ? { lastPath: row.last_path, lastLabel: row.last_label, updatedAt: row.updated_at } : null;
}

/** Só registra caminhos conhecidos — o navegador não escolhe o que fica salvo. */
export async function recordMyProgress(pathName: string, label: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "youth") return;
  db()
    .prepare(
      `INSERT INTO progress (user_id, last_path, last_label, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET last_path = excluded.last_path,
         last_label = excluded.last_label, updated_at = excluded.updated_at`,
    )
    .run(user.id, pathName, label, now());
}

// ---------- Diário (jovem, só o dono) ----------

export type JournalEntry = { id: string; title: string; body: string; createdAt: number; updatedAt: number };

function toEntry(r: Record<string, unknown>): JournalEntry {
  return {
    id: r.id as string,
    title: r.title as string,
    body: r.body as string,
    createdAt: r.created_at as number,
    updatedAt: r.updated_at as number,
  };
}

export async function listMyJournal(): Promise<JournalEntry[]> {
  const user = await requireUser(["youth"], "/app/diario");
  return (
    db()
      .prepare("SELECT * FROM journal_entries WHERE user_id = ? ORDER BY updated_at DESC")
      .all(user.id) as Record<string, unknown>[]
  ).map(toEntry);
}

export async function getMyJournalEntry(id: string): Promise<JournalEntry | null> {
  const user = await requireUser(["youth"], "/app/diario");
  const row = db()
    .prepare("SELECT * FROM journal_entries WHERE id = ? AND user_id = ?")
    .get(id, user.id) as Record<string, unknown> | undefined;
  return row ? toEntry(row) : null;
}

export async function saveMyJournalEntry(
  id: string | null,
  data: { title: string; body: string },
): Promise<string | null> {
  const user = await requireUser(["youth"], "/app/diario");
  if (id) {
    const res = db()
      .prepare(
        "UPDATE journal_entries SET title = ?, body = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      )
      .run(data.title, data.body, now(), id, user.id);
    return res.changes ? id : null;
  }
  const newEntryId = newId();
  db()
    .prepare(
      `INSERT INTO journal_entries (id, user_id, title, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(newEntryId, user.id, data.title, data.body, now(), now());
  return newEntryId;
}

export async function deleteMyJournalEntry(id: string): Promise<boolean> {
  const user = await requireUser(["youth"], "/app/diario");
  const res = db()
    .prepare("DELETE FROM journal_entries WHERE id = ? AND user_id = ?")
    .run(id, user.id);
  return res.changes > 0;
}

// ---------- Conversa com IA (jovem, só o dono) ----------

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: number };

export async function getMyLatestConversation(): Promise<{ id: string; messages: ChatMessage[] } | null> {
  const user = await requireUser(["youth"], "/app/conversa");
  const conv = db()
    .prepare("SELECT id FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1")
    .get(user.id) as { id: string } | undefined;
  if (!conv) return null;
  const messages = (
    db()
      .prepare(
        "SELECT id, role, content, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC",
      )
      .all(conv.id) as { id: string; role: "user" | "assistant"; content: string; created_at: number }[]
  ).map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at }));
  return { id: conv.id, messages };
}

export async function ensureMyConversation(): Promise<string> {
  const existing = await getMyLatestConversation();
  if (existing) return existing.id;
  const user = await requireUser(["youth"], "/app/conversa");
  const id = newId();
  db()
    .prepare("INSERT INTO ai_conversations (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)")
    .run(id, user.id, now(), now());
  return id;
}

export async function appendToMyConversation(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  flagged = false,
): Promise<void> {
  const user = await requireUser(["youth"], "/app/conversa");
  const owns = db()
    .prepare("SELECT 1 FROM ai_conversations WHERE id = ? AND user_id = ?")
    .get(conversationId, user.id);
  if (!owns) throw new Error("conversation_not_found");
  transaction(() => {
    db()
      .prepare(
        "INSERT INTO ai_messages (id, conversation_id, role, content, flagged, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(newId(), conversationId, role, content, flagged ? 1 : 0, now());
    db().prepare("UPDATE ai_conversations SET updated_at = ? WHERE id = ?").run(now(), conversationId);
  });
}

export async function clearMyConversations(): Promise<void> {
  const user = await requireUser(["youth"], "/app/conversa");
  db().prepare("DELETE FROM ai_conversations WHERE user_id = ?").run(user.id);
}

// ---------- Diretório público ----------

export type PublicProfessional = {
  id: string;
  fullName: string;
  profession: string;
  registry: string;
  modality: string;
  city: string;
  specialties: string;
  bio: string;
};

/** Só profissionais aprovados, e só campos públicos (sem e-mail). */
export function listApprovedProfessionals(): PublicProfessional[] {
  return (
    db()
      .prepare(
        `SELECT user_id, full_name, profession, registry_number, registry_state, modality, city, specialties, bio
         FROM professional_profiles WHERE status = 'approved' ORDER BY full_name`,
      )
      .all() as Record<string, string>[]
  ).map((r) => ({
    id: r.user_id,
    fullName: r.full_name,
    profession: r.profession,
    registry: `${r.registry_number} (${r.registry_state})`,
    modality: r.modality,
    city: r.city,
    specialties: r.specialties,
    bio: r.bio,
  }));
}

// ---------- Pedidos de apoio ----------

export type RequestStatus = "open" | "accepted" | "closed" | "cancelled";

export type SupportRequest = {
  id: string;
  topic: string;
  message: string;
  status: RequestStatus;
  response: string;
  createdAt: number;
  updatedAt: number;
  counterpartName: string;
};

export async function listMyRequests(): Promise<SupportRequest[]> {
  const user = await requireUser(["youth"], "/app/pedidos");
  return (
    db()
      .prepare(
        `SELECT r.*, p.full_name AS counterpart FROM support_requests r
         JOIN professional_profiles p ON p.user_id = r.professional_id
         WHERE r.youth_id = ? ORDER BY r.updated_at DESC`,
      )
      .all(user.id) as Record<string, unknown>[]
  ).map(toRequest);
}

function toRequest(r: Record<string, unknown>): SupportRequest {
  return {
    id: r.id as string,
    topic: r.topic as string,
    message: r.message as string,
    status: r.status as RequestStatus,
    response: r.response as string,
    createdAt: r.created_at as number,
    updatedAt: r.updated_at as number,
    counterpartName: r.counterpart as string,
  };
}

export async function createMyRequest(input: {
  professionalId: string;
  topic: string;
  message: string;
}): Promise<"ok" | "professional_unavailable" | "too_many_open"> {
  const user = await requireUser(["youth"], "/app/pedidos");
  const approved = db()
    .prepare("SELECT 1 FROM professional_profiles WHERE user_id = ? AND status = 'approved'")
    .get(input.professionalId);
  if (!approved) return "professional_unavailable";
  const open = db()
    .prepare("SELECT COUNT(*) AS n FROM support_requests WHERE youth_id = ? AND status IN ('open','accepted')")
    .get(user.id) as { n: number };
  if (open.n >= 3) return "too_many_open";
  db()
    .prepare(
      `INSERT INTO support_requests (id, youth_id, professional_id, topic, message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(newId(), user.id, input.professionalId, input.topic, input.message, now(), now());
  return "ok";
}

export async function cancelMyRequest(id: string): Promise<boolean> {
  const user = await requireUser(["youth"], "/app/pedidos");
  const res = db()
    .prepare(
      "UPDATE support_requests SET status = 'cancelled', updated_at = ? WHERE id = ? AND youth_id = ? AND status = 'open'",
    )
    .run(now(), id, user.id);
  return res.changes > 0;
}

// ---------- Profissional ----------

export type ProfessionalProfile = ProfileInput & {
  status: "pending" | "approved" | "rejected";
  reviewNote: string;
  email: string;
};

export async function getMyProfessionalProfile(): Promise<ProfessionalProfile> {
  const user = await requireUser(["professional"], "/pro");
  const r = db()
    .prepare("SELECT * FROM professional_profiles WHERE user_id = ?")
    .get(user.id) as Record<string, string>;
  return {
    fullName: r.full_name,
    profession: r.profession,
    registryNumber: r.registry_number,
    registryState: r.registry_state,
    modality: r.modality as ProfileInput["modality"],
    city: r.city,
    specialties: r.specialties,
    bio: r.bio,
    status: r.status as ProfessionalProfile["status"],
    reviewNote: r.review_note,
    email: user.email,
  };
}

/** Mudar o registro profissional devolve o perfil para análise. */
export async function updateMyProfessionalProfile(input: ProfileInput): Promise<{ backToReview: boolean }> {
  const user = await requireUser(["professional"], "/pro/perfil");
  const current = await getMyProfessionalProfile();
  const registryChanged =
    current.registryNumber !== input.registryNumber ||
    current.registryState !== input.registryState ||
    current.profession !== input.profession ||
    current.fullName !== input.fullName;
  const backToReview = registryChanged && current.status !== "pending";
  db()
    .prepare(
      `UPDATE professional_profiles SET full_name = ?, profession = ?, registry_number = ?, registry_state = ?,
         specialties = ?, bio = ?, modality = ?, city = ?, updated_at = ?,
         status = CASE WHEN ? THEN 'pending' ELSE status END
       WHERE user_id = ?`,
    )
    .run(
      input.fullName, input.profession, input.registryNumber, input.registryState,
      input.specialties, input.bio, input.modality, input.city, now(),
      registryChanged ? 1 : 0, user.id,
    );
  return { backToReview };
}

async function requireApprovedProfessional(): Promise<CurrentUser> {
  const user = await requireUser(["professional"], "/pro/pedidos");
  const row = db()
    .prepare("SELECT status FROM professional_profiles WHERE user_id = ?")
    .get(user.id) as { status: string } | undefined;
  if (row?.status !== "approved") redirect("/pro?aviso=aguardando-aprovacao");
  return user;
}

export async function listRequestsForMe(): Promise<SupportRequest[]> {
  const user = await requireApprovedProfessional();
  return (
    db()
      .prepare(
        `SELECT r.*, u.display_name AS counterpart FROM support_requests r
         JOIN users u ON u.id = r.youth_id
         WHERE r.professional_id = ? AND r.status <> 'cancelled'
         ORDER BY CASE r.status WHEN 'open' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END, r.updated_at DESC`,
      )
      .all(user.id) as Record<string, unknown>[]
  ).map(toRequest);
}

export async function respondToRequest(
  id: string,
  response: string,
  status: "accepted" | "closed",
): Promise<boolean> {
  const user = await requireApprovedProfessional();
  const res = db()
    .prepare(
      `UPDATE support_requests SET response = ?, status = ?, updated_at = ?
       WHERE id = ? AND professional_id = ? AND status IN ('open','accepted')`,
    )
    .run(response, status, now(), id, user.id);
  return res.changes > 0;
}

// ---------- Admin ----------

export type AdminProfessional = PublicProfessional & {
  status: "pending" | "approved" | "rejected";
  email: string;
  reviewNote: string;
  updatedAt: number;
};

export async function listProfessionalsForReview(): Promise<AdminProfessional[]> {
  await requireUser(["admin"], "/admin");
  return (
    db()
      .prepare(
        `SELECT p.*, u.email FROM professional_profiles p JOIN users u ON u.id = p.user_id
         ORDER BY CASE p.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, p.updated_at DESC`,
      )
      .all() as Record<string, string | number>[]
  ).map((r) => ({
    id: r.user_id as string,
    fullName: r.full_name as string,
    profession: r.profession as string,
    registry: `${r.registry_number} (${r.registry_state})`,
    modality: r.modality as string,
    city: r.city as string,
    specialties: r.specialties as string,
    bio: r.bio as string,
    status: r.status as AdminProfessional["status"],
    email: r.email as string,
    reviewNote: r.review_note as string,
    updatedAt: r.updated_at as number,
  }));
}

export async function reviewProfessional(
  userId: string,
  status: "approved" | "rejected",
  note: string,
): Promise<boolean> {
  await requireUser(["admin"], "/admin");
  const res = db()
    .prepare(
      "UPDATE professional_profiles SET status = ?, review_note = ?, reviewed_at = ? WHERE user_id = ?",
    )
    .run(status, note, now(), userId);
  return res.changes > 0;
}

// ---------- Painel do jovem ----------

export async function getMyDashboard() {
  const user = await requireUser(["youth"], "/app");
  const d = db();
  const lastEntry = d
    .prepare("SELECT id, title, updated_at FROM journal_entries WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1")
    .get(user.id) as { id: string; title: string; updated_at: number } | undefined;
  const conv = d
    .prepare(
      `SELECT c.updated_at, (SELECT COUNT(*) FROM ai_messages m WHERE m.conversation_id = c.id) AS n
       FROM ai_conversations c WHERE c.user_id = ? ORDER BY c.updated_at DESC LIMIT 1`,
    )
    .get(user.id) as { updated_at: number; n: number } | undefined;
  const answered = d
    .prepare(
      "SELECT COUNT(*) AS n FROM support_requests WHERE youth_id = ? AND response <> '' AND status IN ('accepted','closed')",
    )
    .get(user.id) as { n: number };
  const open = d
    .prepare("SELECT COUNT(*) AS n FROM support_requests WHERE youth_id = ? AND status = 'open'")
    .get(user.id) as { n: number };
  return {
    user,
    progress: await getMyProgress(),
    lastEntry: lastEntry
      ? { id: lastEntry.id, title: lastEntry.title, updatedAt: lastEntry.updated_at }
      : null,
    conversation: conv && conv.n > 0 ? { updatedAt: conv.updated_at, count: conv.n } : null,
    requests: { answered: answered.n, open: open.n },
  };
}
