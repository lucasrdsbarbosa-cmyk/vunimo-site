"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { improveDraftWithAi, saveDraft } from "@/app/actions/tools";
import { FocusFirstError, FormMessage, SubmitButton } from "@/components/Form";
import { Icon } from "@/components/Icons";
import type { FormState } from "@/lib/validation";

export function DraftEditor({ id, title, body }: { id: string; title: string; body: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveDraft, {});
  const [text, setText] = useState(body);
  const [saved, setSaved] = useState(body);
  const [previous, setPrevious] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<{ tone: "ok" | "info" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [improving, startImprove] = useTransition();
  const dirty = text !== saved;

  // Depois de salvar com sucesso, o texto atual vira a referência de "salvo".
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.ok) setSaved(text);
  }

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-1.5">
        <label htmlFor="d-title" className="font-semibold">
          Nome do rascunho
        </label>
        <input id="d-title" name="title" defaultValue={state.values?.title ?? title} maxLength={120} className="field-input" autoComplete="off" />
        {state.errors?.title ? <p className="text-sm font-semibold text-alerta">{state.errors.title[0]}</p> : null}
      </div>
      <div className="grid gap-1.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label htmlFor="d-body" className="font-semibold">
            Texto
          </label>
          <span className="text-sm text-muted">{dirty ? "Alterações não salvas" : "Tudo salvo"}</span>
        </div>
        <textarea
          id="d-body"
          name="body"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          maxLength={8000}
          aria-invalid={state.errors?.body ? true : undefined}
          aria-busy={improving}
          className={`field-input font-[inherit] leading-relaxed ${improving ? "vn-shimmer" : ""}`}
        />
        {state.errors?.body ? <p className="text-sm font-semibold text-alerta">{state.errors.body[0]}</p> : null}
      </div>

      <div aria-live="polite">
        {aiNote ? (
          <p
            className={`rounded-xl px-4 py-3 text-[0.95rem] ${
              aiNote.tone === "error" ? "bg-alerta-bg font-semibold text-alerta" : aiNote.tone === "ok" ? "bg-ok-bg text-ok" : "bg-nevoa"
            }`}
          >
            {aiNote.text}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Salvando…">Salvar rascunho</SubmitButton>
        <button
          type="button"
          className="btn btn-secondary vn-press"
          disabled={improving}
          onClick={() => {
            const before = text;
            startImprove(async () => {
              setAiNote(null);
              const res = await improveDraftWithAi(id, before);
              if (res.error || !res.text) {
                setAiNote({ tone: "error", text: res.error ?? "Não foi possível melhorar agora." });
                return;
              }
              setPrevious(before);
              setText(res.text);
              setAiNote(
                res.mode === "demo"
                  ? { tone: "info", text: "Modo demonstração: a IA não está configurada, então só organizamos os espaços. Revise e salve." }
                  : { tone: "ok", text: "A IA reorganizou o texto sem mudar os fatos. Confira tudo antes de salvar ou enviar." },
              );
            });
          }}
        >
          <span className="rounded bg-nevoa px-1.5 text-xs font-semibold text-iris">IA</span>
          {improving ? "Melhorando…" : "Melhorar com IA"}
        </button>
        {previous !== null ? (
          <button
            type="button"
            className="btn vn-press text-iris underline underline-offset-4"
            onClick={() => {
              setText(previous);
              setPrevious(null);
              setAiNote({ tone: "info", text: "Texto anterior restaurado." });
            }}
          >
            Desfazer melhoria
          </button>
        ) : null}
        <button
          type="button"
          className="btn vn-press text-iris"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setAiNote({ tone: "error", text: "Não deu para copiar. Selecione o texto e copie manualmente." });
            }
          }}
        >
          <Icon name={copied ? "check" : "evidence"} className="h-5 w-5" />
          {copied ? "Copiado" : "Copiar texto"}
        </button>
      </div>
      <p className="text-sm text-muted">
        A Vunimo não envia nada por você. Copie o texto e use no canal escolhido quando se sentir pronto(a).
      </p>
    </form>
  );
}
