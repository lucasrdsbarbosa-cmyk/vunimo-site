"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupYouth } from "@/app/actions/auth";
import { FocusFirstError, Checkbox, Field, FormMessage, SubmitButton } from "@/components/Form";
import type { FormState } from "@/lib/validation";

export function SignupForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signupYouth, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        label="Como quer ser chamado(a)?"
        name="displayName"
        hint="Pode ser um apelido. Não use seu nome completo."
        autoComplete="nickname"
        maxLength={30}
        required
        defaultValue={v.displayName}
        errors={state.errors?.displayName}
      />
      <Field
        label="E-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        hint="Usado só para você entrar. Não mandamos propaganda."
        required
        defaultValue={v.email}
        errors={state.errors?.email}
      />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres."
        required
        errors={state.errors?.password}
      />
      <Field
        label="Ano em que você nasceu"
        name="birthYear"
        inputMode="numeric"
        maxLength={4}
        hint="A Vunimo é para pessoas a partir de 13 anos."
        required
        defaultValue={v.birthYear}
        errors={state.errors?.birthYear}
      />
      <Checkbox name="consent" errors={state.errors?.consent} defaultChecked={v.consent === "on"}>
        Li{" "}
        <Link href="/privacidade" className="link" target="_blank">
          como meus dados são usados
        </Link>{" "}
        e sei que a Vunimo não substitui atendimento profissional ou de emergência.
      </Checkbox>
      <SubmitButton pendingLabel="Criando conta…">Criar conta</SubmitButton>
    </form>
  );
}
