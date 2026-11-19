"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import {
  createMyDraft,
  deleteMyDraft,
  deleteMyPlan,
  deleteMyTimelineEvent,
  draftTemplate,
  getMyDraft,
  listMyTimeline,
  saveMyPlanAnswers,
  saveMyTimelineEvent,
  toggleMyPlanStep,
  updateMyDraft,
  type Recipient,
} from "@/lib/dal-tools";
import { improveReportDraft } from "@/lib/ai/provider";
import { rateLimit } from "@/lib/rate-limit";
import {
  draftSchema,
  fieldErrors,
  keepValues,
  planAnswersSchema,
  RECIPIENTS,
  timelineEventSchema,
  type FormState,
} from "@/lib/validation";

// ---------- Linha do tempo ----------

export async function saveTimelineEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = timelineEventSchema.safeParse({
    happenedOn: formData.get("happenedOn"),
    happenedTime: formData.get("happenedTime") ?? "",
    platform: formData.get("platform"),
    kind: formData.get("kind"),
    description: formData.get("description"),
    people: formData.get("people") ?? "",
    hasEvidence: formData.get("hasEvidence"),
    evidenceNote: formData.get("evidenceNote") ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  const id = (formData.get("id") as string) || null;
  const saved = await saveMyTimelineEvent(id, { ...parsed.data, hasEvidence: parsed.data.hasEvidence === "sim" });
  if (!saved) return { message: "Não encontramos esse registro. Ele pode ter sido apagado." };
  revalidatePath("/app/linha-do-tempo");
  redirect(`/app/linha-do-tempo?${id ? "atualizado" : "salvo"}=1#r-${saved}`);
}

export async function deleteTimelineEvent(formData: FormData): Promise<void> {
  const ok = await deleteMyTimelineEvent(String(formData.get("id") ?? ""));
  revalidatePath("/app/linha-do-tempo");
  redirect(ok ? "/app/linha-do-tempo?apagado=1" : "/app/linha-do-tempo?erro=1");
}

// ---------- Plano ----------

export async function savePlanAnswers(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = planAnswersSchema.safeParse({
    where: formData.get("where"),
    kinds: formData.getAll("kinds"),
    ongoing: formData.get("ongoing"),
    adult: formData.get("adult"),
    risk: formData.get("risk"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: { ...keepValues(formData), kinds: formData.getAll("kinds").join(",") } };
  }
  await saveMyPlanAnswers(parsed.data);
  revalidatePath("/app/plano");
  redirect("/app/plano?pronto=1");
}

export async function togglePlanStep(stepId: string, done: boolean): Promise<{ ok: boolean }> {
  const ok = await toggleMyPlanStep(stepId, done);
  revalidatePath("/app");
  return { ok };
}

export async function resetPlan(): Promise<void> {
  await deleteMyPlan();
  revalidatePath("/app/plano");
  redirect("/app/plano?refazer=1");
}

// ---------- Rascunhos de denúncia ----------

export async function createDraft(formData: FormData): Promise<void> {
  const user = await requireUser(["youth"], "/app/denuncia");
  const recipient = String(formData.get("recipient") ?? "") as Recipient;
  if (!(recipient in RECIPIENTS)) redirect("/app/denuncia?erro=destinatario");
  const events = await listMyTimeline();
  const id = await createMyDraft(recipient, `Para: ${RECIPIENTS[recipient]}`, draftTemplate(recipient, events, user.displayName));
  revalidatePath("/app/denuncia");
  redirect(`/app/denuncia?rascunho=${id}&novo=1`);
}

export async function saveDraft(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = draftSchema.safeParse({ title: formData.get("title"), body: formData.get("body") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  const ok = await updateMyDraft(String(formData.get("id") ?? ""), parsed.data.title, parsed.data.body);
  if (!ok) return { message: "Não encontramos esse rascunho." };
  revalidatePath("/app/denuncia");
  return { ok: true, message: "Rascunho salvo.", values: keepValues(formData) };
}

export type ImproveState = { text?: string; mode?: "ai" | "demo" | "unavailable"; error?: string };

/** A IA reescreve o texto atual do rascunho; nada é salvo até a pessoa revisar e salvar. */
export async function improveDraftWithAi(id: string, currentText: string): Promise<ImproveState> {
  const user = await requireUser(["youth"], "/app/denuncia");
  const draft = await getMyDraft(id);
  if (!draft) return { error: "Não encontramos esse rascunho." };
  const text = currentText.trim();
  if (text.length < 20 || text.length > 8000) return { error: "O rascunho precisa ter entre 20 e 8.000 caracteres." };
  if (!rateLimit(`ai-draft:${user.id}`, 10, 60 * 60 * 1000)) {
    return { error: "Você chegou ao limite de melhorias por hora. Tente de novo mais tarde." };
  }
  const result = await improveReportDraft(text);
  if (result.mode === "unavailable") return { error: "A IA não está disponível agora. Seu texto continua como estava." };
  return { text: result.text, mode: result.mode };
}

export async function deleteDraft(formData: FormData): Promise<void> {
  const ok = await deleteMyDraft(String(formData.get("id") ?? ""));
  revalidatePath("/app/denuncia");
  redirect(ok ? "/app/denuncia?apagado=1" : "/app/denuncia?erro=1");
}
