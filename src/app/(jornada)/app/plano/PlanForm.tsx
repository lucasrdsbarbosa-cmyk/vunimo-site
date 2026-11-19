"use client";

import { useActionState } from "react";
import { savePlanAnswers } from "@/app/actions/tools";
import { FocusFirstError, FormMessage, SubmitButton } from "@/components/Form";
import { PLAN_QUESTIONS } from "@/lib/plan";
import type { FormState } from "@/lib/validation";

type Key = keyof typeof PLAN_QUESTIONS;
const ORDER: Key[] = ["where", "kinds", "ongoing", "adult", "risk"];

export function PlanForm() {
  const [state, action] = useActionState<FormState, FormData>(savePlanAnswers, {});
  const v = state.values ?? {};
  const kinds = (v.kinds ?? "").split(",");

  return (
    <form action={action} className="grid gap-6" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} />
      {ORDER.map((key, i) => {
        const q = PLAN_QUESTIONS[key];
        const multi = key === "kinds";
        const err = state.errors?.[key];
        return (
          <fieldset key={key} data-invalid={err ? "" : undefined} className="vn-step-card grid gap-3 rounded-2xl border border-line bg-white p-5" style={{ "--i": i } as React.CSSProperties}>
            <legend className="sr-only">{q.label}</legend>
            <p aria-hidden="true" className="flex items-center gap-3 text-lg font-semibold">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nevoa text-sm text-iris">{i + 1}</span>
              {q.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => (
                <label key={o.value} className="vn-chip">
                  <input
                    type={multi ? "checkbox" : "radio"}
                    name={key}
                    value={o.value}
                    defaultChecked={multi ? kinds.includes(o.value) : v[key] === o.value}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
            {err ? <p className="text-sm font-semibold text-alerta">{err[0]}</p> : null}
          </fieldset>
        );
      })}
      <p className="text-sm text-muted">Suas respostas ficam salvas só para você e servem para montar o checklist.</p>
      <div>
        <SubmitButton pendingLabel="Montando seu plano…">Montar meu plano</SubmitButton>
      </div>
    </form>
  );
}
