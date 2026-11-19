"use client";

import { useActionState } from "react";
import { respondRequest } from "@/app/actions/pro";
import { FocusFirstError, Field, FormMessage, SubmitButton } from "@/components/Form";
import type { FormState } from "@/lib/validation";

export function ResponseForm({ id, current }: { id: string; current: string }) {
  const [state, action] = useActionState<FormState, FormData>(respondRequest, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="id" value={id} />
      <Field
        label={current ? "Atualizar resposta" : "Sua resposta"}
        name="response"
        multiline
        rows={5}
        maxLength={2000}
        required
        hint="Acolha, oriente próximos passos e, se houver risco, indique CVV 188 e SAMU 192."
        defaultValue={state.values?.response ?? current}
        errors={state.errors?.response}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton name="intent" value="reply" pendingLabel="Enviando…">
          Enviar resposta
        </SubmitButton>
        <SubmitButton name="intent" value="close" className="btn btn-secondary" pendingLabel="Enviando…">
          Responder e encerrar
        </SubmitButton>
      </div>
    </form>
  );
}
