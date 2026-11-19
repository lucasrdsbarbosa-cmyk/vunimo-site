"use client";

import { useActionState } from "react";
import { createRequest } from "@/app/actions/youth";
import { FocusFirstError, Checkbox, Field, FormMessage, SubmitButton } from "@/components/Form";
import { REQUEST_TOPICS, type FormState } from "@/lib/validation";

export function RequestForm({
  professionals,
  preselected,
}: {
  professionals: { id: string; label: string }[];
  preselected?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(createRequest, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} />
      <Field
        label="Para quem"
        name="professionalId"
        required
        options={professionals.map((p) => ({ value: p.id, label: p.label }))}
        defaultValue={v.professionalId ?? preselected}
        errors={state.errors?.professionalId}
      />
      <Field label="Assunto" name="topic" required options={REQUEST_TOPICS} defaultValue={v.topic} errors={state.errors?.topic} />
      <Field
        label="Sua mensagem"
        name="message"
        multiline
        rows={6}
        maxLength={1500}
        required
        hint="Conte o que aconteceu e o que você gostaria de saber. Não inclua telefone, endereço ou nome da escola."
        defaultValue={v.message}
        errors={state.errors?.message}
      />
      <Checkbox name="privacy" errors={state.errors?.privacy} defaultChecked={v.privacy === "on"}>
        Entendo que só esse profissional vai ler a mensagem, junto com meu apelido, e que a resposta pode levar
        alguns dias.
      </Checkbox>
      <SubmitButton pendingLabel="Enviando pedido…">Enviar pedido</SubmitButton>
    </form>
  );
}
