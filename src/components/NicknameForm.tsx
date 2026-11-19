"use client";

import { useActionState } from "react";
import { updateNickname } from "@/app/actions/youth";
import { Field, FocusFirstError, FormMessage, SubmitButton } from "./Form";
import type { FormState } from "@/lib/validation";

export function NicknameForm({ current }: { current: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateNickname, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} ok={state.ok} />
      <Field
        label="Apelido"
        name="displayName"
        maxLength={30}
        required
        defaultValue={state.values?.displayName ?? current}
        errors={state.errors?.displayName}
      />
      <div>
        <SubmitButton pendingLabel="Salvando…">Salvar apelido</SubmitButton>
      </div>
    </form>
  );
}
