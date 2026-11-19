"use client";

import { useEffect } from "react";

const TARGETS = ".btn, .vn-press, .vn-chip, .vn-cal-nav, .vn-cal-quick button, [data-ripple]";

/**
 * Resposta visual imediata ao toque: uma onda curta nasce do ponto clicado em botões e alvos de toque.
 * Um único ouvinte para o site todo; não roda com "reduzir movimento" do sistema.
 */
export function PressFeedback() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onDown = (e: PointerEvent) => {
      if (reduce.matches || e.button !== 0) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(TARGETS);
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;

      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      let host = el.querySelector<HTMLSpanElement>(":scope > .vn-ripple-host");
      if (!host) {
        host = document.createElement("span");
        host.className = "vn-ripple-host";
        host.setAttribute("aria-hidden", "true");
        el.appendChild(host);
      }
      const r = el.getBoundingClientRect();
      const size = Math.hypot(r.width, r.height) * 2;
      const dot = document.createElement("span");
      dot.className = "vn-ripple";
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.left = `${e.clientX - r.left}px`;
      dot.style.top = `${e.clientY - r.top}px`;
      host.appendChild(dot);
      dot.addEventListener("animationend", () => dot.remove(), { once: true });
    };

    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return null;
}
