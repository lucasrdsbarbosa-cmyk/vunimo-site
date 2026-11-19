"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Posiciona um indicador (".vn-ind") sobre o item com aria-current="page" dentro de `root`.
 * Escreve só variáveis CSS (--x, --y, --w, --h), então a troca anima por transform, sem re-render.
 * A primeira medida não anima; as seguintes deslizam até a nova aba.
 */
export function useSlidingIndicator<R extends HTMLElement, I extends HTMLElement>(activeKey: unknown) {
  const rootRef = useRef<R>(null);
  const indRef = useRef<I>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const ind = indRef.current;
    if (!root || !ind) return;

    const measure = () => {
      const active = root.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active || active.offsetParent === null) {
        ind.removeAttribute("data-visible");
        return;
      }
      const r = root.getBoundingClientRect();
      const a = active.getBoundingClientRect();
      ind.style.setProperty("--x", `${a.left - r.left + root.scrollLeft}px`);
      ind.style.setProperty("--y", `${a.top - r.top + root.scrollTop}px`);
      ind.style.setProperty("--w", `${a.width}px`);
      ind.style.setProperty("--h", `${a.height}px`);
      ind.setAttribute("data-visible", "");
    };

    measure();
    // Liga a transição só depois da primeira posição pintada.
    const raf = requestAnimationFrame(() => ind.setAttribute("data-ready", ""));
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [activeKey]);

  return { rootRef, indRef };
}
