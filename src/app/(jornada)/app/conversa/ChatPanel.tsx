"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icons";
import { UrgentHelp } from "@/components/UrgentHelp";
import { useSpeechToText, useTextToSpeech } from "@/components/voice";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  /** Mensagem da pessoa que não chegou a ser respondida (pode tentar de novo). */
  failed?: { message: string; retryable: boolean };
};
type StreamEvent =
  | { type: "start"; conversationId: string; risk: boolean }
  | { type: "delta"; text: string }
  | { type: "done"; messageId: string; userMessageId: string }
  | { type: "error"; code: string; message: string; retryable: boolean; conversationGone?: boolean };

const VOICE_KEY = "vn-modo-voz";
const voiceListeners = new Set<() => void>();
const readVoiceMode = () => {
  try {
    return localStorage.getItem(VOICE_KEY) === "1";
  } catch {
    return false;
  }
};
function setVoiceMode(on: boolean) {
  try {
    localStorage.setItem(VOICE_KEY, on ? "1" : "0");
  } catch {
    /* sem armazenamento: vale só agora */
  }
  voiceListeners.forEach((l) => l());
}
const subscribeVoice = (l: () => void) => {
  voiceListeners.add(l);
  return () => voiceListeners.delete(l);
};

let seq = 0;
const localId = (p: string) => `${p}-${Date.now()}-${seq++}`;

export function ChatPanel({
  conversationId: initialConversationId,
  messages,
  initialDraft = "",
  configured,
}: {
  conversationId: string | null;
  messages: Msg[];
  initialDraft?: string;
  configured: boolean;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(messages);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [draft, setDraft] = useState(initialDraft);
  const [sending, setSending] = useState(false);
  const [risk, setRisk] = useState(false);
  const voiceMode = useSyncExternalStore(subscribeVoice, readVoiceMode, () => false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false); // trava síncrona: dois cliques rápidos não enviam duas vezes

  const tts = useTextToSpeech();
  const stt = useSpeechToText((text) => {
    const next = draft ? `${draft.trimEnd()} ${text}` : text;
    if (voiceMode) void send(next);
    else {
      setDraft(next);
      inputRef.current?.focus();
    }
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(raw: string, retryOf?: string) {
    const text = raw.trim();
    if (!text || sendingRef.current || !configured) return;
    sendingRef.current = true;
    setSending(true);
    tts.cancel();

    const userId = localId("u");
    const replyId = localId("a");
    setMsgs((m) => [
      ...m.filter((x) => x.id !== retryOf),
      { id: userId, role: "user", content: text },
      { id: replyId, role: "assistant", content: "", streaming: true },
    ]);
    if (!retryOf) setDraft("");

    const fail = (message: string, retryable: boolean) =>
      setMsgs((m) =>
        m.filter((x) => x.id !== replyId).map((x) => (x.id === userId ? { ...x, failed: { message, retryable } } : x)),
      );

    const controller = new AbortController();
    abortRef.current = controller;
    let full = "";

    try {
      const res = await fetch("/api/conversa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        fail(data.error ?? `O servidor respondeu com erro ${res.status}.`, res.status === 429 || res.status >= 500);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as StreamEvent;
          if (ev.type === "start") {
            setConversationId(ev.conversationId);
            // Endereço da conversa atual, para recarregar ou voltar a ela depois.
            window.history.replaceState(null, "", `/app/conversa?c=${ev.conversationId}`);
            if (ev.risk) setRisk(true);
          } else if (ev.type === "delta") {
            full += ev.text;
            const now = full;
            setMsgs((m) => m.map((x) => (x.id === replyId ? { ...x, content: now } : x)));
          } else if (ev.type === "done") {
            finished = true;
            setMsgs((m) =>
              m.map((x) =>
                x.id === replyId ? { ...x, id: ev.messageId, streaming: false } : x.id === userId ? { ...x, id: ev.userMessageId } : x,
              ),
            );
            if (voiceMode && full.trim()) tts.speak(ev.messageId, full);
          } else if (ev.type === "error") {
            finished = true;
            if (ev.conversationGone) {
              setConversationId(null);
              window.history.replaceState(null, "", "/app/conversa?nova=1");
            }
            fail(ev.message, ev.retryable);
          }
        }
      }
      if (!finished) fail("A conexão caiu antes de a resposta terminar.", true);
    } catch (e) {
      if ((e as Error).name !== "AbortError") fail("Não foi possível falar com o servidor. Confira sua internet.", true);
    } finally {
      sendingRef.current = false;
      setSending(false);
      abortRef.current = null;
    }
  }

  const shownDraft = stt.listening && stt.interim ? `${draft ? `${draft.trimEnd()} ` : ""}${stt.interim}` : draft;
  // O aviso de erro acompanha a última mensagem enviada: some quando uma nova dá certo.
  const lastFailed = [...msgs].reverse().find((m) => m.role === "user");

  return (
    <div className="flex flex-col gap-4">
      <div
        role="log"
        aria-live="polite"
        aria-busy={sending}
        aria-label="Mensagens da conversa"
        className="min-h-[18rem] rounded-[var(--radius-card)] bg-white p-4 sm:p-6"
      >
        {msgs.length === 0 ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
            <Icon name="chat" className="h-10 w-10 text-iris" />
            <p className="mt-3 text-lg">{configured ? "Comece quando quiser." : "A conversa com IA está desligada."}</p>
            <p className="max-w-sm text-muted">
              {configured
                ? "Pode escrever ou falar: um oi, o que aconteceu, como está se sentindo ou qualquer pergunta."
                : "Quando a chave da Anthropic for configurada no servidor, as respostas aparecem aqui."}
            </p>
          </div>
        ) : (
          <ol className="grid gap-3">
            {msgs.map((m) => (
              <li key={m.id} className={`vn-chat-msg flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[85%] flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 ${
                      m.role === "user"
                        ? `rounded-br-md bg-iris text-white ${m.failed ? "opacity-70" : ""}`
                        : "rounded-bl-md bg-nevoa text-grafite"
                    }`}
                  >
                    <span className="sr-only">{m.role === "user" ? "Você:" : "IA:"} </span>
                    {m.content ? (
                      <>
                        {m.content}
                        {m.streaming ? <span aria-hidden="true" className="vn-caret" /> : null}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-muted">
                        A IA está escrevendo
                        <span className="vn-dots" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                        </span>
                      </span>
                    )}
                  </div>
                  {m.failed ? (
                    <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                      <span className="font-semibold text-alerta">Não enviada</span>
                      {m.failed.retryable ? (
                        <button
                          type="button"
                          className="vn-press inline-flex min-h-9 items-center rounded-full bg-alerta-bg px-3 font-semibold text-alerta"
                          disabled={sending}
                          onClick={() => void send(m.content, m.id)}
                        >
                          Tentar de novo
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {m.role === "assistant" && m.content && !m.streaming && tts.supported ? (
                    <button
                      type="button"
                      className="vn-press inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-iris hover:bg-nevoa"
                      aria-pressed={tts.speakingId === m.id}
                      onClick={() => (tts.speakingId === m.id ? tts.cancel() : tts.speak(m.id, m.content))}
                    >
                      <Icon name={tts.speakingId === m.id ? "stop" : "speaker"} className="h-4 w-4" />
                      {tts.speakingId === m.id ? "Parar" : "Ouvir"}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      {risk ? <UrgentHelp /> : null}
      {lastFailed?.failed ? (
        <p role="alert" className="vn-msg rounded-xl bg-alerta-bg px-4 py-3 font-semibold text-alerta" data-tone="error">
          {lastFailed.failed.message}
        </p>
      ) : null}
      {stt.error ? (
        <p role="status" className="vn-msg rounded-xl bg-nevoa px-4 py-3 text-[0.95rem] text-grafite">
          {stt.error}
        </p>
      ) : null}

      <form
        className="flex items-end gap-2 sm:gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <div className="flex-1">
          <label htmlFor="chat-message" className="mb-1 block font-semibold">
            Sua mensagem
          </label>
          <textarea
            id="chat-message"
            ref={inputRef}
            name="message"
            rows={2}
            maxLength={2000}
            autoComplete="off"
            required
            disabled={!configured}
            placeholder={
              !configured ? "IA desligada neste servidor" : stt.listening ? "Ouvindo… pode falar" : "Escreva ou toque no microfone…"
            }
            className="field-input resize-y disabled:cursor-not-allowed disabled:bg-papel"
            value={shownDraft}
            readOnly={stt.listening}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </div>
        <button
          type="button"
          className="vn-mic flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-nevoa text-iris"
          data-listening={stt.listening ? "" : undefined}
          aria-pressed={stt.listening}
          onClick={() => (stt.listening ? stt.stop() : stt.start())}
          disabled={sending || !configured}
        >
          <Icon name={stt.listening ? "stop" : "mic"} className="h-5 w-5" />
          <span className="sr-only">{stt.listening ? "Parar de ouvir" : "Falar em vez de escrever"}</span>
        </button>
        <button
          type="submit"
          disabled={sending || stt.listening || !configured}
          aria-busy={sending}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-iris text-white hover:bg-iris-deep disabled:opacity-60"
        >
          {sending ? (
            <span className="vn-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          ) : (
            <Icon name="send" className="h-5 w-5" />
          )}
          <span className="sr-only">{sending ? "Enviando…" : "Enviar mensagem"}</span>
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Enter envia · Shift + Enter quebra a linha</p>
        <label className="vn-chip cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={voiceMode}
            disabled={!configured}
            onChange={(e) => {
              setVoiceMode(e.target.checked);
              if (!e.target.checked) tts.cancel();
            }}
          />
          <span>Modo voz: enviar ao terminar de falar e ouvir as respostas</span>
        </label>
      </div>
      <p className="text-xs text-muted">
        Voz: o navegador transforma sua fala em texto (no Chrome e no Edge isso passa pelo serviço de voz deles) e lê as
        respostas com as vozes do aparelho. A Vunimo recebe só o texto.
      </p>
    </div>
  );
}
