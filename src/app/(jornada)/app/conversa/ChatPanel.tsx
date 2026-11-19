"use client";

import { useActionState, useEffect, useOptimistic, useRef } from "react";
import { sendChatMessage, type ChatState } from "@/app/actions/youth";
import { Icon } from "@/components/Icons";
import { UrgentHelp } from "@/components/UrgentHelp";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export function ChatPanel({ messages }: { messages: Msg[] }) {
  const [optimistic, addOptimistic] = useOptimistic<Msg[], string>(messages, (state, text) => [
    ...state,
    { id: `pending-${state.length}`, role: "user", content: text },
  ]);
  const [state, action, pending] = useActionState<ChatState, FormData>(async (prev, formData) => {
    const text = String(formData.get("message") ?? "").trim();
    if (text) addOptimistic(text);
    return sendChatMessage(prev, formData);
  }, {});
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [optimistic.length, pending]);

  return (
    <div className="flex flex-col gap-4">
      <div
        role="log"
        aria-live="polite"
        aria-label="Mensagens da conversa"
        className="min-h-[18rem] rounded-[var(--radius-card)] bg-white p-4 sm:p-6"
      >
        {optimistic.length === 0 ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
            <Icon name="chat" className="h-10 w-10 text-iris" />
            <p className="mt-3 text-lg">Comece quando quiser.</p>
            <p className="max-w-sm text-muted">
              Você pode contar o que aconteceu, como está se sentindo, ou perguntar o que fazer.
            </p>
          </div>
        ) : (
          <ol className="grid gap-3">
            {optimistic.map((m) => (
              <li key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 ${
                    m.role === "user" ? "rounded-br-md bg-iris text-white" : "rounded-bl-md bg-nevoa text-grafite"
                  }`}
                >
                  <span className="sr-only">{m.role === "user" ? "Você:" : "IA:"} </span>
                  {m.content}
                </div>
              </li>
            ))}
            {pending ? (
              <li className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-nevoa px-4 py-3 text-muted">A IA está escrevendo…</div>
              </li>
            ) : null}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      {state.risk ? <UrgentHelp tone="card" /> : null}
      {state.error ? (
        <p role="alert" className="rounded-xl bg-alerta-bg px-4 py-3 font-semibold text-alerta">
          {state.error}
        </p>
      ) : null}

      <form action={action} className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="chat-message" className="mb-1 block font-semibold">
            Sua mensagem
          </label>
          <textarea
            id="chat-message"
            name="message"
            rows={2}
            maxLength={2000}
            autoComplete="off"
            required
            placeholder="Escreva aqui…"
            className="field-input resize-y"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-iris text-white hover:bg-iris-deep disabled:opacity-60"
        >
          <Icon name="send" className="h-5 w-5" />
          <span className="sr-only">Enviar mensagem</span>
        </button>
      </form>
      <p className="text-sm text-muted">Enter envia · Shift + Enter quebra a linha</p>
    </div>
  );
}
