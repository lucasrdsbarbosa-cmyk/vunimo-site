"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupProfessional } from "@/app/actions/auth";
import { FocusFirstError, Checkbox, Field, FormMessage, SubmitButton } from "@/components/Form";
import { ProfileFields } from "@/components/ProfileFields";
import type { FormState } from "@/lib/validation";

export function ProfessionalSignupForm() {
  const [state, action] = useActionState<FormState, FormData>(signupProfessional, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-8" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} />
      {state.errors ? (
        <p role="alert" className="rounded-xl bg-alerta-bg px-4 py-3 font-semibold text-alerta">
          Alguns campos precisam de ajuste. Confira as mensagens em vermelho.
        </p>
      ) : null}

      <fieldset className="grid gap-5">
        <legend className="mb-1 text-xl font-semibold">1. Acesso</legend>
        <Field label="E-mail profissional" name="email" type="email" inputMode="email" autoComplete="email" required defaultValue={v.email} errors={state.errors?.email} hint="Não aparece no diretório." />
        <Field label="Senha" name="password" type="password" autoComplete="new-password" hint="Pelo menos 8 caracteres." required errors={state.errors?.password} />
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="mb-1 text-xl font-semibold">2. Perfil profissional</legend>
        <ProfileFields values={v} errors={state.errors} />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-xl font-semibold">3. Compromisso</legend>
        <Checkbox name="agreement" errors={state.errors?.agreement} defaultChecked={v.agreement === "on"}>
          Li as{" "}
          <Link href="/profissionais#diretrizes" className="link" target="_blank">
            diretrizes de participação
          </Link>{" "}
          e confirmo que os dados do registro são verdadeiros.
        </Checkbox>
      </fieldset>

      <SubmitButton pendingLabel="Enviando cadastro…">Enviar cadastro para análise</SubmitButton>
    </form>
  );
}
