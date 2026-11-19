"use client";

import { useActionState } from "react";
import { saveTimelineEvent } from "@/app/actions/tools";
import { Field, FocusFirstError, FormMessage, SubmitButton } from "@/components/Form";
import { EVENT_KINDS, PLATFORMS, type FormState } from "@/lib/validation";
import type { TimelineEvent } from "@/lib/dal-tools";

export function TimelineForm({ event, today }: { event?: TimelineEvent; today: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveTimelineEvent, {});
  const v = state.values ?? {};
  const evidence = v.hasEvidence ?? (event ? (event.hasEvidence ? "sim" : "nao") : "");

  return (
    <form action={action} className="grid gap-5" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} />
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Quando aconteceu"
          name="happenedOn"
          type="date"
          required
          defaultValue={v.happenedOn ?? event?.happenedOn ?? today}
          errors={state.errors?.happenedOn}
        />
        <Field
          label="Horário"
          name="happenedTime"
          type="time"
          defaultValue={v.happenedTime ?? event?.happenedTime}
          errors={state.errors?.happenedTime}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Onde" name="platform" required options={PLATFORMS} defaultValue={v.platform ?? event?.platform} errors={state.errors?.platform} />
        <Field label="Tipo" name="kind" required options={EVENT_KINDS} defaultValue={v.kind ?? event?.kind} errors={state.errors?.kind} />
      </div>
      <Field
        label="O que aconteceu"
        name="description"
        multiline
        rows={4}
        maxLength={1500}
        required
        hint="Escreva do seu jeito. Se for pesado, use poucas palavras."
        defaultValue={v.description ?? event?.description}
        errors={state.errors?.description}
      />
      <Field
        label="Quem (nome de usuário ou perfil)"
        name="people"
        maxLength={200}
        hint="Fica só aqui. Não vai no resumo enviado a profissionais."
        defaultValue={v.people ?? event?.people}
        errors={state.errors?.people}
      />
      <fieldset className="grid gap-2" data-invalid={state.errors?.hasEvidence ? "" : undefined}>
        <legend className="font-semibold">Você guardou print ou registro?</legend>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "sim", label: "Sim" },
            { value: "nao", label: "Ainda não" },
          ].map((o) => (
            <label key={o.value} className="vn-chip">
              <input type="radio" name="hasEvidence" value={o.value} defaultChecked={evidence === o.value} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        {state.errors?.hasEvidence ? <p className="text-sm font-semibold text-alerta">{state.errors.hasEvidence[0]}</p> : null}
      </fieldset>
      <Field
        label="Onde está guardado"
        name="evidenceNote"
        maxLength={300}
        hint="Ex.: pasta “Prints” no celular, enviado para minha mãe."
        defaultValue={v.evidenceNote ?? event?.evidenceNote}
        errors={state.errors?.evidenceNote}
      />
      <div>
        <SubmitButton pendingLabel="Salvando…">{event ? "Salvar alterações" : "Adicionar à linha do tempo"}</SubmitButton>
      </div>
    </form>
  );
}
