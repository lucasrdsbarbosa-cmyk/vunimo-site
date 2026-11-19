"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { togglePlanStep } from "@/app/actions/tools";
import { Icon } from "@/components/Icons";
import type { PlanStep } from "@/lib/plan";

export function PlanChecklist({ steps, done }: { steps: PlanStep[]; done: string[] }) {
  const [optimisticDone, setOptimistic] = useOptimistic(done, (state: string[], change: { id: string; on: boolean }) =>
    change.on ? [...state, change.id] : state.filter((d) => d !== change.id),
  );
  const [, startTransition] = useTransition();
  const total = steps.length;
  const count = optimisticDone.length;
  const pct = Math.round((count / total) * 100);

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl bg-white p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-semibold">
            {count} de {total} passos feitos
          </p>
          <p className="text-sm text-muted">{count === total ? "Você concluiu o plano." : "Vá no seu ritmo."}</p>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-nevoa"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={count}
          aria-label="Progresso do plano"
        >
          <div className="vn-progress h-full rounded-full bg-iris" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ol className="grid gap-3">
        {steps.map((s, i) => {
          const checked = optimisticDone.includes(s.id);
          return (
            <li
              key={s.id}
              className={`vn-step-card rounded-2xl border p-4 sm:p-5 ${
                s.urgent ? "border-alerta/40 bg-alerta-bg" : checked ? "border-line bg-white/60" : "border-line bg-white"
              }`}
              style={{ "--i": i } as React.CSSProperties}
            >
              <label className="flex cursor-pointer items-start gap-4">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const on = e.currentTarget.checked;
                    startTransition(async () => {
                      setOptimistic({ id: s.id, on });
                      await togglePlanStep(s.id, on);
                    });
                  }}
                  className="vn-check mt-0.5"
                />
                <span className="flex-1">
                  <span className={`block text-lg font-semibold ${checked ? "text-muted line-through decoration-2" : ""}`}>
                    {s.urgent ? <span className="mr-2 rounded-full bg-alerta px-2 py-0.5 text-xs text-white no-underline">Agora</span> : null}
                    {s.title}
                  </span>
                  <span className="mt-1 block text-grafite/80">{s.detail}</span>
                </span>
              </label>
              {s.href ? (
                <div className="mt-3 pl-11">
                  {s.href.startsWith("http") ? (
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="link inline-flex min-h-11 items-center gap-1">
                      {s.linkLabel}
                      <Icon name="arrow" className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link href={s.href} className="link inline-flex min-h-11 items-center gap-1">
                      {s.linkLabel}
                      <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
