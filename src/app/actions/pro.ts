"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  deleteMyAccount,
  respondToRequest,
  reviewProfessional,
  updateMyProfessionalProfile,
} from "@/lib/dal";
import { endSession } from "@/lib/session";
import {
  fieldErrors,
  keepValues,
  professionalProfileSchema,
  requestResponseSchema,
  type FormState,
} from "@/lib/validation";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = professionalProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    profession: formData.get("profession"),
    registryNumber: formData.get("registryNumber"),
    registryState: formData.get("registryState"),
    modality: formData.get("modality"),
    city: formData.get("city") ?? "",
    specialties: formData.get("specialties"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  const { backToReview } = await updateMyProfessionalProfile(parsed.data);
  revalidatePath("/pro", "layout");
  return {
    ok: true,
    message: backToReview
      ? "Perfil salvo. Como você mudou dados do registro, ele voltou para análise e sai do diretório até ser aprovado de novo."
      : "Perfil salvo.",
  };
}

export async function respondRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = requestResponseSchema.safeParse({ response: formData.get("response") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  const status = formData.get("intent") === "close" ? "closed" : "accepted";
  const ok = await respondToRequest(String(formData.get("id") ?? ""), parsed.data.response, status);
  if (!ok) return { message: "Esse pedido não está mais disponível para resposta." };
  revalidatePath("/pro/pedidos");
  return { ok: true, message: status === "closed" ? "Resposta enviada e pedido encerrado." : "Resposta enviada." };
}

export async function deleteProfessionalAccount(formData: FormData): Promise<void> {
  if (formData.get("confirm") !== "APAGAR") redirect("/pro/perfil?erro=confirmacao");
  await deleteMyAccount();
  await endSession();
  redirect("/?conta-apagada=1");
}

export async function reviewAction(formData: FormData): Promise<void> {
  const decision = formData.get("decision") === "approved" ? "approved" : "rejected";
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  const ok = await reviewProfessional(String(formData.get("userId") ?? ""), decision, note);
  revalidatePath("/admin");
  revalidatePath("/conectar");
  redirect(ok ? `/admin?revisado=${decision}` : "/admin?erro=nao-encontrado");
}
