"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icons";
import { UrgentHelp } from "@/components/UrgentHelp";
import { useSpeechToText, useTextToSpeech } from "@/components/voice";

type Msg = { id: string; role: "user" | "assistant"; content: string; streaming?: boolean };
type StreamEvent =
  | { type: "start"; risk: boolean }
  | { type: "delta"; text: string }
  | { type: "done"; mode: "ai" | "demo" }
  | { type: "error"; message: string };

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

export function ChatPanel({ messages, initialDraft = "" }: { messages: Msg[]; initialDraft?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(messages);
  const [draft, setDraft] = useState(initialDraft);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [risk, setRisk] = useState(false);
  const voiceMode = useSyncExternalStore(subscribeVoice, readVoiceMode, () => false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;
    setError(null);
    tts.cancel();
    const userMsg: Msg = { id: localId("u"), role: "user", content: text };
    const replyId = localId("a");
    setMsgs((m) => [...m, userMsg, { id: replyId, role: "assistant", content: "", streaming: true }]);
    setDraft("");
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const dropReply = () => setMsgs((m) => m.filter((x) => x.id !== replyId));
    let full = "";

    try {
      const res = await fetch("/api/conversa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        // Nada foi gravado: devolve o texto para a caixa.
        setMsgs((m) => m.filter((x) => x.id !== replyId && x.id !== userMsg.id));
        setDraft(text);
        setError(data.error ?? "Não foi possível enviar agora. Tente de novo.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
            if (ev.risk) setRisk(true);
          } else if (ev.type === "delta") {
            full += ev.text;
            const now = full;
            setMsgs((m) => m.map((x) => (x.id === replyId ? { ...x, content: now } : x)));
          } else if (ev.type === "done") {
            setMsgs((m) => m.map((x) => (x.id === replyId ? { ...x, streaming: false } : x)));
            if (voiceMode && full.trim()) tts.speak(replyId, full);
          } else if (ev.type === "error") {
            dropReply();
            setError(ev.message);
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        if (!full) dropReply();
        setError("A conexão caiu no meio da resposta. Tente de novo.");
      }
    } finally {
      setMsgs((m) => m.map((x) => (x.id === replyId ? { ...x, streaming: false } : x)));
      setSending(false);
      abortRef.current = null;
    }
  }

  const shownDraft = stt.listening && stt.interim ? `${draft ? `${draft.trimEnd()} ` : ""}${stt.interim}` : draft;

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
            <p className="mt-3 text-lg">Comece quando quiser.</p>
            <p className="max-w-sm text-muted">
              Pode escrever ou falar: conte o que aconteceu, como está se sentindo, ou pergunte o que fazer.
            </p>
          </div>
        ) : (
          <ol className="grid gap-3">
            {msgs.map((m) => (
              <li key={m.id} className={`vn-chat-msg flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[85%] flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 ${
                      m.role === "user" ? "rounded-br-md bg-iris text-white" : "rounded-bl-md bg-nevoa text-grafite"
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
      {error ? (
        <p role="alert" className="vn-msg rounded-xl bg-alerta-bg px-4 py-3 font-semibold text-alerta" data-tone="error">
          {error}
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
            placeholder={stt.listening ? "Ouvindo… pode falar" : "Escreva ou toque no microfone…"}
            className="field-input resize-y"
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
          disabled={sending}
        >
          <Icon name={stt.listening ? "stop" : "mic"} className="h-5 w-5" />
          <span className="sr-only">{stt.listening ? "Parar de ouvir" : "Falar em vez de escrever"}</span>
        </button>
        <button
          type="submit"
          disabled={sending || stt.listening}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-iris text-white hover:bg-iris-deep disabled:opacity-60"
        >
          <Icon name="send" className="h-5 w-5" />
          <span className="sr-only">Enviar mensagem</span>
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Enter envia · Shift + Enter quebra a linha</p>
        <label className="vn-chip cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={voiceMode}
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
