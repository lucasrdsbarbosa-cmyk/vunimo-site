"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getMotion = () => document.documentElement.classList.contains("vn-motion");
const getServer = () => null;

/**
 * Deixa a pessoa escolher: ver a abertura animada mesmo com "reduzir movimento" no sistema,
 * ou desligar a animação. A escolha fica salva só neste navegador.
 */
export function MotionToggle({ tone = "iris" }: { tone?: "iris" | "paper" }) {
  const motion = useSyncExternalStore(subscribe, getMotion, getServer);
  if (motion === null) return null;

  const choose = (value: "on" | "off") => {
    try {
      localStorage.setItem("vn-motion", value);
    } catch {
      /* sem armazenamento: vale só para esta visita */
    }
    window.scrollTo(0, 0);
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={() => choose(motion ? "off" : "on")}
      className={`vn-press inline-flex min-h-11 items-center gap-2 self-start rounded-full px-4 text-sm font-semibold ${
        tone === "iris" ? "bg-white/15 text-white hover:bg-white/25" : "bg-nevoa text-iris hover:bg-white"
      }`}
    >
      <span aria-hidden="true" className="relative flex h-4 w-7 items-center rounded-full bg-current/30">
        <span className={`absolute h-3 w-3 rounded-full bg-current transition-all ${motion ? "left-3.5" : "left-0.5"}`} />
      </span>
      {motion ? "Reduzir movimento" : "Ver abertura animada"}
    </button>
  );
}
