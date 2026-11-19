"use client";

import { useActionState, useState, useTransition } from "react";
import { respondRequest, suggestReply } from "@/app/actions/pro";
import { FocusFirstError, FormMessage, SubmitButton } from "@/components/Form";
import type { FormState } from "@/lib/validation";

export function ResponseForm({ id, current }: { id: string; current: string }) {
  const [state, action] = useActionState<FormState, FormData>(respondRequest, {});
  const [text, setText] = useState(state.values?.response ?? current);
  const [note, setNote] = useState<{ error?: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const fieldId = `resp-${id}`;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-1.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label htmlFor={fieldId} className="font-semibold">
            {current ? "Atualizar resposta" : "Sua resposta"}
          </label>
          <button
            type="button"
            disabled={pending}
            className="vn-press inline-flex min-h-11 items-center gap-2 rounded-full bg-nevoa px-4 text-sm font-semibold text-iris disabled:opacity-60"
            onClick={() =>
              start(async () => {
                setNote(null);
                const res = await suggestReply(id);
                if (res.error || !res.text) {
                  setNote({ error: true, text: res.error ?? "Não foi possível sugerir agora." });
                  return;
                }
                setText(res.text);
                setNote({
                  text:
                    res.mode === "demo"
                      ? "Modo demonstração: rascunho de exemplo (a IA não está configurada). Edite antes de enviar."
                      : "Rascunho sugerido pela IA. Revise e ajuste com o seu olhar profissional antes de enviar.",
                });
              })
            }
          >
            <span className="rounded bg-white px-1.5 text-xs">IA</span>
            {pending ? "Sugerindo…" : "Sugerir rascunho"}
          </button>
        </div>
        <p className="text-sm text-muted">Acolha, oriente próximos passos e, se houver risco, indique CVV 188 e SAMU 192.</p>
        <textarea
          id={fieldId}
          name="response"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={2000}
          aria-invalid={state.errors?.response ? true : undefined}
          className={`field-input ${pending ? "vn-shimmer" : ""}`}
        />
        {state.errors?.response ? <p className="text-sm font-semibold text-alerta">{state.errors.response[0]}</p> : null}
        <div aria-live="polite">
          {note ? (
            <p className={`rounded-xl px-4 py-2 text-sm ${note.error ? "bg-alerta-bg font-semibold text-alerta" : "bg-nevoa"}`}>{note.text}</p>
          ) : null}
        </div>
      </div>
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
