"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  createProfessional,
  createYouth,
  emailInUse,
  verifyLogin,
} from "@/lib/dal";
import { endSession, homeFor, startSession, type Role } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  fieldErrors,
  keepValues,
  loginSchema,
  professionalSignupSchema,
  youthSignupSchema,
  type FormState,
} from "@/lib/validation";

// Em desenvolvimento o limite de cadastros é folgado para não travar testes automatizados.
const SIGNUPS_PER_HOUR = process.env.NODE_ENV === "production" ? 10 : 500;
const LOGINS_PER_10_MIN = process.env.NODE_ENV === "production" ? 8 : 500;

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Aceita só caminhos internos, para evitar redirecionamento para outro site. */
function safeNext(value: FormDataEntryValue | null, role: Role): string {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return homeFor(role);
  const allowed =
    role === "youth"
      ? !next.startsWith("/pro") && !next.startsWith("/admin")
      : role === "professional"
        ? next.startsWith("/pro")
        : next.startsWith("/admin");
  return allowed ? next : homeFor(role);
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  }
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}:${parsed.data.email}`, LOGINS_PER_10_MIN, 10 * 60 * 1000)) {
    return {
      message: "Muitas tentativas seguidas. Espere 10 minutos e tente de novo.",
      values: keepValues(formData),
    };
  }
  const user = await verifyLogin(parsed.data.email, parsed.data.password);
  if (!user) {
    return {
      message: "E-mail ou senha não conferem. Confira os dados e tente de novo.",
      values: keepValues(formData),
    };
  }
  await startSession(user.id);
  redirect(safeNext(formData.get("next"), user.role));
}

export async function signupYouth(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = youthSignupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    birthYear: formData.get("birthYear"),
    consent: formData.get("consent") ?? undefined,
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  }
  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, SIGNUPS_PER_HOUR, 60 * 60 * 1000)) {
    return { message: "Muitos cadastros a partir desta conexão. Tente mais tarde.", values: keepValues(formData) };
  }
  if (emailInUse(parsed.data.email)) {
    return {
      errors: { email: ["Já existe uma conta com esse e-mail. Tente entrar."] },
      values: keepValues(formData),
    };
  }
  const id = await createYouth(parsed.data);
  await startSession(id);
  redirect(`${safeNext(formData.get("next"), "youth")}${formData.get("next") ? "" : "?boas-vindas=1"}`);
}

export async function signupProfessional(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = professionalSignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    profession: formData.get("profession"),
    registryNumber: formData.get("registryNumber"),
    registryState: formData.get("registryState"),
    modality: formData.get("modality"),
    city: formData.get("city") ?? "",
    specialties: formData.get("specialties"),
    bio: formData.get("bio"),
    agreement: formData.get("agreement") ?? undefined,
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  }
  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, SIGNUPS_PER_HOUR, 60 * 60 * 1000)) {
    return { message: "Muitos cadastros a partir desta conexão. Tente mais tarde.", values: keepValues(formData) };
  }
  if (emailInUse(parsed.data.email)) {
    return {
      errors: { email: ["Já existe uma conta com esse e-mail. Tente entrar."] },
      values: keepValues(formData),
    };
  }
  const id = await createProfessional(parsed.data);
  await startSession(id);
  redirect("/pro?cadastro=1");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/?saiu=1");
}
