"use client";

import { useEffect, useRef, useState } from "react";
import { VunimoSymbol } from "@/components/Logo";

// Ciclo de 10 s: inspirar 4 s, segurar 1 s, soltar 5 s (combina com o CSS).
const PHASES = [
  { label: "Inspire", seconds: 4 },
  { label: "Segure", seconds: 1 },
  { label: "Solte devagar", seconds: 5 },
];
const CYCLE = 10;
const DURATIONS = [
  { value: 60, label: "1 minuto" },
  { value: 180, label: "3 minutos" },
  { value: 300, label: "5 minutos" },
];

type Status = "idle" | "running" | "done";

export function Breathing({ onDoneHref }: { onDoneHref?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [duration, setDuration] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (status !== "running") return;
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000);
      if (secs >= duration) {
        setElapsed(duration);
        setStatus("done");
      } else {
        setElapsed(secs);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [status, duration]);

  const inCycle = elapsed % CYCLE;
  const phase = inCycle < 4 ? PHASES[0] : inCycle < 5 ? PHASES[1] : PHASES[2];
  const remaining = Math.max(0, duration - elapsed);
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="grid items-center gap-8 md:grid-cols-[1fr_1fr]">
      <div
        className={`relative mx-auto flex aspect-square w-full max-w-[19rem] items-center justify-center ${
          status === "running" ? "breathing" : ""
        }`}
      >
        <span aria-hidden="true" className="halo absolute inset-0 rounded-full bg-nevoa" />
        <span aria-hidden="true" className="halo absolute inset-[14%] rounded-full bg-[#d8d3f5]" />
        <span className="absolute inset-[24%] rounded-full bg-white shadow-sm" />
        <VunimoSymbol className="relative h-[42%] w-[42%] overflow-visible" />
      </div>

      <div className="text-center md:text-left">
        <p aria-live="polite" className="min-h-[3.5rem] text-4xl font-semibold text-grafite">
          {status === "running" ? phase.label : status === "done" ? "Pronto." : "Respire no seu ritmo"}
        </p>
        {status === "running" ? (
          <p className="mt-1 text-lg text-muted">
            Faltam {mm}:{ss}. Você pode parar quando quiser.
          </p>
        ) : status === "done" ? (
          <p className="mt-1 text-lg text-muted">
            Como você está agora? Se quiser, escolha um próximo passo abaixo.
          </p>
        ) : (
          <p className="mt-1 text-lg text-muted">
            Acompanhe as formas: elas se afastam quando você inspira e se aproximam quando solta o ar.
          </p>
        )}

        {status !== "running" ? (
          <fieldset className="mt-6">
            <legend className="mb-2 font-semibold">Duração</legend>
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              {DURATIONS.map((d) => (
                <label
                  key={d.value}
                  className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 ${
                    duration === d.value ? "border-iris bg-nevoa font-semibold text-iris" : "border-line bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="duracao"
                    value={d.value}
                    checked={duration === d.value}
                    onChange={() => setDuration(d.value)}
                    className="sr-only"
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
          {status === "running" ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStatus("done")}>
              Parar
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setElapsed(0);
                setStatus("running");
              }}
            >
              {status === "done" ? "Fazer de novo" : "Começar"}
            </button>
          )}
          {onDoneHref && status === "done" ? (
            <a href={onDoneHref} className="btn btn-secondary">
              Voltar ao início
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
