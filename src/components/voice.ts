"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ---------- Tipos mínimos da Web Speech API (não fazem parte do TypeScript padrão) ---------- */
type RecResult = { isFinal: boolean; 0: { transcript: string } };
type RecEvent = { resultIndex: number; results: ArrayLike<RecResult> };
type RecErrorEvent = { error: string };
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: RecErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};
/** true/false no navegador; null durante a renderização no servidor. */
function useClientValue(get: () => boolean): boolean | null {
  return useSyncExternalStore(noop, get, () => null);
}

const RECOGNITION_ERRORS: Record<string, string> = {
  "not-allowed": "O microfone está bloqueado. Libere o microfone para este site (ícone ao lado do endereço) e tente de novo.",
  "service-not-allowed":
    "Este navegador não oferece ditado por voz. No celular, use o microfone do próprio teclado; no computador, use o Chrome ou o Edge.",
  network:
    "O ditado por voz não está disponível neste navegador (o Brave, por exemplo, não oferece). No celular, use o microfone do teclado; no computador, o Chrome ou o Edge.",
  "no-speech": "Não ouvi nada. Tente de novo, falando perto do microfone.",
  "audio-capture": "Nenhum microfone foi encontrado neste aparelho.",
  "language-not-supported": "O ditado em português não está disponível neste navegador.",
};

/**
 * Fala → texto, com o reconhecimento de voz do próprio navegador (pt-BR).
 * `onFinal` recebe a frase reconhecida quando a pessoa para de falar.
 */
export function useSpeechToText(onFinal: (text: string) => void) {
  const supported = useClientValue(() => recognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  const stop = useCallback(() => recRef.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setError(RECOGNITION_ERRORS["service-not-allowed"]);
      return;
    }
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    finalRef.current = "";
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setError(RECOGNITION_ERRORS[e.error] ?? "Não foi possível usar o microfone agora.");
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      recRef.current = null;
      const text = finalRef.current.trim();
      if (text) onFinalRef.current(text);
    };
    recRef.current = rec;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Não foi possível ligar o microfone agora.");
    }
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, interim, error, start, stop, clearError: () => setError(null) };
}

/** Escolhe a melhor voz em português do Brasil disponível no aparelho. */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "pt-BR" && /natural|online|neural/i.test(v.name)) ??
    voices.find((v) => v.lang === "pt-BR") ??
    voices.find((v) => v.lang.startsWith("pt"))
  );
}

/** Texto → fala, com as vozes do próprio aparelho (nada sai do navegador). */
export function useTextToSpeech() {
  const supported = useClientValue(() => "speechSynthesis" in window);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback((id: string, text: string) => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = 1.02;
    u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
    u.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));
    setSpeakingId(id);
    synth.speak(u);
  }, []);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { supported, speakingId, speak, cancel };
}
