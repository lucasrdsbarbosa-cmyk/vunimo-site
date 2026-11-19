"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  appendToMyConversation,
  cancelMyRequest,
  clearMyConversations,
  createMyRequest,
  deleteMyAccount,
  deleteMyJournalEntry,
  ensureMyConversation,
  getMyLatestConversation,
  recordMyProgress,
  requireUser,
  saveMyJournalEntry,
  updateMyDisplayName,
} from "@/lib/dal";
import { endSession } from "@/lib/session";
import { listMyTimeline, timelineSummary } from "@/lib/dal-tools";
import { rateLimit } from "@/lib/rate-limit";
import { generateReply } from "@/lib/ai/provider";
import { hasRiskSignal } from "@/lib/ai/safety";
import {
  chatMessageSchema,
  displayNameSchema,
  fieldErrors,
  journalSchema,
  keepValues,
  supportRequestSchema,
  type FormState,
} from "@/lib/validation";

// Só estes caminhos podem ser salvos como "onde parei".
const TRACKABLE: Record<string, string> = {
  "/pausa": "Pausa",
  "/desabafar": "Desabafar",
  "/orientar": "Orientação",
  "/orientar/silenciar": "Orientação: Silenciar",
  "/orientar/bloquear": "Orientação: Bloquear",
  "/orientar/preservar-evidencias": "Orientação: Preservar evidências",
  "/orientar/denunciar": "Orientação: Denunciar",
  "/conectar": "Apoio",
  "/app/diario": "Meu diário",
  "/app/conversa": "Conversa com IA",
  "/app/pedidos": "Pedidos de apoio",
  "/app/linha-do-tempo": "Linha do tempo",
  "/app/plano": "Plano de próximos passos",
  "/app/denuncia": "Rascunho de denúncia",
};

export async function trackVisit(pathName: string): Promise<void> {
  const label = TRACKABLE[pathName];
  if (label) await recordMyProgress(pathName, label);
}

// ---------- Diário ----------

export async function saveJournal(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = journalSchema.safeParse({
    title: formData.get("title") ?? "",
    body: formData.get("body"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  const id = (formData.get("id") as string) || null;
  const savedId = await saveMyJournalEntry(id, parsed.data);
  if (!savedId) return { message: "Não encontramos esse registro. Ele pode ter sido apagado." };
  revalidatePath("/app/diario");
  redirect(`/app/diario?registro=${savedId}&salvo=1`);
}

export async function deleteJournal(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const ok = await deleteMyJournalEntry(id);
  revalidatePath("/app/diario");
  redirect(ok ? "/app/diario?apagado=1" : "/app/diario?erro=nao-encontrado");
}

// ---------- Conversa com IA ----------

export type ChatState = { error?: string; risk?: boolean; mode?: "ai" | "demo" | "unavailable" };

export async function sendChatMessage(_prev: ChatState, formData: FormData): Promise<ChatState> {
  const user = await requireUser(["youth"], "/app/conversa");
  const parsed = chatMessageSchema.safeParse(formData.get("message"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!rateLimit(`chat:${user.id}`, 30, 60 * 60 * 1000)) {
    return { error: "Você chegou ao limite de mensagens por hora. Que tal uma Pausa ou escrever no diário enquanto isso?" };
  }

  const risk = hasRiskSignal(parsed.data);
  const conversationId = await ensureMyConversation();
  await appendToMyConversation(conversationId, "user", parsed.data, risk);

  const conv = await getMyLatestConversation();
  const reply = await generateReply(
    (conv?.messages ?? []).map((m) => ({ role: m.role, content: m.content })),
  );
  if (reply.mode !== "unavailable") {
    await appendToMyConversation(conversationId, "assistant", reply.text);
  }
  revalidatePath("/app/conversa");
  return {
    risk,
    mode: reply.mode,
    error: reply.mode === "unavailable" ? reply.text : undefined,
  };
}

export async function clearChat(): Promise<void> {
  await clearMyConversations();
  revalidatePath("/app/conversa");
  redirect("/app/conversa?limpa=1");
}

// ---------- Pedidos de apoio ----------

export async function createRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["youth"], "/app/pedidos");
  const parsed = supportRequestSchema.safeParse({
    professionalId: formData.get("professionalId"),
    topic: formData.get("topic"),
    message: formData.get("message"),
    privacy: formData.get("privacy") ?? undefined,
    attachTimeline: formData.get("attachTimeline") ?? undefined,
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  if (!rateLimit(`request:${user.id}`, 5, 24 * 60 * 60 * 1000)) {
    return { message: "Você já enviou vários pedidos hoje. Aguarde as respostas ou use os canais de apoio.", values: keepValues(formData) };
  }
  // Só anexa o resumo se o jovem marcou a opção (o profissional não lê a linha do tempo diretamente).
  const attachment = parsed.data.attachTimeline ? timelineSummary(await listMyTimeline()) : "";
  const result = await createMyRequest({
    professionalId: parsed.data.professionalId,
    topic: parsed.data.topic,
    message: parsed.data.message,
    attachment,
  });
  if (result === "professional_unavailable") {
    return { errors: { professionalId: ["Esse profissional não está disponível agora. Escolha outro."] }, values: keepValues(formData) };
  }
  if (result === "too_many_open") {
    return { message: "Você já tem 3 pedidos em andamento. Espere uma resposta ou cancele um deles para enviar outro.", values: keepValues(formData) };
  }
  revalidatePath("/app/pedidos");
  redirect("/app/pedidos?enviado=1");
}

export async function cancelRequest(formData: FormData): Promise<void> {
  const ok = await cancelMyRequest(String(formData.get("id") ?? ""));
  revalidatePath("/app/pedidos");
  redirect(ok ? "/app/pedidos?cancelado=1" : "/app/pedidos?erro=nao-cancelado");
}

// ---------- Conta ----------

export async function updateNickname(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = displayNameSchema.safeParse(formData.get("displayName"));
  if (!parsed.success) return { errors: { displayName: [parsed.error.issues[0].message] }, values: keepValues(formData) };
  await updateMyDisplayName(parsed.data);
  revalidatePath("/app", "layout");
  return { ok: true, message: "Apelido atualizado." };
}

export async function deleteAccount(formData: FormData): Promise<void> {
  if (formData.get("confirm") !== "APAGAR") redirect("/app/conta?erro=confirmacao");
  await deleteMyAccount();
  await endSession();
  redirect("/?conta-apagada=1");
}
