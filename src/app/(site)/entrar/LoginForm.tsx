"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { FocusFirstError, Field, FormMessage, SubmitButton } from "@/components/Form";
import type { FormState } from "@/lib/validation";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        errors={state.errors?.email}
      />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state.errors?.password}
      />
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
