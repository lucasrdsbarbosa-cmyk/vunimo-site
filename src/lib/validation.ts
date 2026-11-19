import { z } from "zod";

export const MIN_AGE = 13;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Digite um e-mail válido, como nome@exemplo.com." }));

const password = z
  .string()
  .min(8, { error: "A senha precisa ter pelo menos 8 caracteres." })
  .max(128, { error: "A senha pode ter no máximo 128 caracteres." });

const checkbox = (msg: string) =>
  z.literal("on", { error: msg });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Digite sua senha." }),
});

export const youthSignupSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, { error: "Escolha um apelido com pelo menos 2 letras." })
      .max(30, { error: "O apelido pode ter até 30 caracteres." }),
    email,
    password,
    birthYear: z.coerce
      .number({ error: "Informe o ano em que você nasceu." })
      .int({ error: "Informe o ano com 4 números." })
      .min(1900, { error: "Informe o ano com 4 números." })
      .max(new Date().getFullYear(), { error: "Esse ano ainda não chegou." }),
    consent: checkbox("Para criar a conta, confirme que leu como seus dados são usados."),
  })
  .refine((v) => new Date().getFullYear() - v.birthYear >= MIN_AGE, {
    path: ["birthYear"],
    error:
      "A Vunimo é para quem tem 13 anos ou mais. Você ainda pode usar a Pausa, a Orientação e os canais de apoio sem conta — e vale conversar com um adulto de confiança.",
  });

export const PROFESSIONS = [
  "Psicologia",
  "Psiquiatria",
  "Medicina (outra especialidade)",
  "Serviço social",
  "Enfermagem",
  "Outra área da saúde",
] as const;

export const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

const professionalFields = {
  fullName: z
    .string()
    .trim()
    .min(5, { error: "Digite seu nome completo." })
    .max(120, { error: "O nome pode ter até 120 caracteres." }),
  profession: z.enum(PROFESSIONS, { error: "Escolha sua área de atuação." }),
  registryNumber: z
    .string()
    .trim()
    .min(3, { error: "Informe o número do registro no conselho (ex.: CRP 06/123456)." })
    .max(40, { error: "O registro pode ter até 40 caracteres." }),
  registryState: z.enum(UFS, { error: "Escolha o estado do registro." }),
  modality: z.enum(["online", "presencial", "ambos"], {
    error: "Escolha como você pode atender.",
  }),
  city: z.string().trim().max(80, { error: "A cidade pode ter até 80 caracteres." }),
  specialties: z
    .string()
    .trim()
    .min(3, { error: "Conte pelo menos uma área de experiência." })
    .max(200, { error: "Use até 200 caracteres." }),
  bio: z
    .string()
    .trim()
    .min(40, { error: "Escreva uma apresentação com pelo menos 40 caracteres." })
    .max(800, { error: "A apresentação pode ter até 800 caracteres." }),
};

export const professionalSignupSchema = z.object({
  ...professionalFields,
  email,
  password,
  agreement: checkbox("Para se cadastrar, aceite as diretrizes de participação."),
});

export const professionalProfileSchema = z.object(professionalFields);

export const journalSchema = z.object({
  title: z.string().trim().max(120, { error: "O título pode ter até 120 caracteres." }),
  body: z
    .string()
    .trim()
    .min(1, { error: "Escreva alguma coisa antes de salvar." })
    .max(10000, { error: "O texto pode ter até 10.000 caracteres." }),
});

export const chatMessageSchema = z
  .string()
  .trim()
  .min(1, { error: "Escreva uma mensagem." })
  .max(2000, { error: "A mensagem pode ter até 2.000 caracteres." });

export const REQUEST_TOPICS = [
  "Ofensas ou humilhação",
  "Exposição de fotos ou informações",
  "Ameaças",
  "Exclusão ou isolamento em grupos",
  "Perfil falso ou se passando por mim",
  "Outro assunto",
] as const;

export const supportRequestSchema = z.object({
  professionalId: z.string().uuid({ error: "Escolha um profissional da lista." }),
  topic: z.enum(REQUEST_TOPICS, { error: "Escolha o assunto." }),
  message: z
    .string()
    .trim()
    .min(20, { error: "Conte um pouco mais (pelo menos 20 caracteres)." })
    .max(1500, { error: "A mensagem pode ter até 1.500 caracteres." }),
  privacy: checkbox("Confirme que entendeu quem vai ler sua mensagem."),
});

export const requestResponseSchema = z.object({
  response: z
    .string()
    .trim()
    .min(10, { error: "Escreva uma resposta com pelo menos 10 caracteres." })
    .max(2000, { error: "A resposta pode ter até 2.000 caracteres." }),
});

export const displayNameSchema = youthSignupSchema.shape.displayName;

export type FieldErrors = Record<string, string[] | undefined>;

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
};

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}

/** Devolve os campos de texto (sem senhas) para repreencher o formulário após erro. */
export function keepValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$") && !k.toLowerCase().includes("password")) {
      out[k] = v;
    }
  }
  return out;
}
