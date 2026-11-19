"use client";

import { useActionState, useEffect, useState } from "react";
import { saveJournal } from "@/app/actions/youth";
import { FocusFirstError, Field, FormMessage, SubmitButton } from "@/components/Form";
import type { FormState } from "@/lib/validation";

export function JournalForm({ entry }: { entry?: { id: string; title: string; body: string } }) {
  const [state, action] = useActionState<FormState, FormData>(saveJournal, {});
  const [dirty, setDirty] = useState(false);
  const v = state.values ?? {};

  // Avisa antes de sair da página com texto não salvo.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form
      action={action}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
      className="grid gap-5"
      noValidate
    >
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} />
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      <Field
        label="Título"
        name="title"
        maxLength={120}
        defaultValue={v.title ?? entry?.title}
        errors={state.errors?.title}
      />
      <Field
        label="Seu texto"
        name="body"
        multiline
        rows={12}
        maxLength={10000}
        required
        placeholder="Comece por onde fizer sentido…"
        defaultValue={v.body ?? entry?.body}
        errors={state.errors?.body}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton pendingLabel="Salvando…">{entry ? "Salvar alterações" : "Salvar no diário"}</SubmitButton>
        <p className="text-sm text-muted">Só você pode ler o que está aqui.</p>
      </div>
    </form>
  );
}
