"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Barra de navegação que acompanha a rolagem sem saltos:
 * - ganha fundo mais sólido e sombra assim que a página sai do topo;
 * - recolhe (sobe) ao descer e volta ao rolar para cima — só com transform, a altura nunca muda;
 * - na página inicial, fica fixa durante toda a abertura animada;
 * - nunca recolhe com o menu aberto ou com o foco dentro dela.
 * O ouvinte é passivo e agrupado por quadro, então a rolagem do mouse e do toque continua nativa.
 */
export function AutoHideHeader({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastY = window.scrollY;
    let travel = 0; // distância acumulada na mesma direção
    let frame = 0;

    const keepVisibleUntil = () => {
      // Na página inicial, a cena fixa usa a altura do topo; só recolhe depois dela.
      const hero = document.querySelector<HTMLElement>(".vn-hero");
      if (!hero) return 96;
      const spacer = hero.parentElement?.classList.contains("pin-spacer") ? hero.parentElement : hero;
      return spacer.getBoundingClientRect().bottom + window.scrollY;
    };

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const dy = y - lastY;
      lastY = y;
      el.toggleAttribute("data-scrolled", y > 4);

      const locked = el.matches(":focus-within") || el.querySelector("[data-open]") !== null;
      if (locked || y < keepVisibleUntil()) {
        travel = 0;
        el.removeAttribute("data-hidden");
        return;
      }
      // Pequenos tremores do trackpad não fazem a barra piscar: exige um trecho contínuo.
      travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;
      if (travel > 24) el.setAttribute("data-hidden", "");
      else if (travel < -12) el.removeAttribute("data-hidden");
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header ref={ref} className={`vn-autohide ${className ?? ""}`} style={style}>
      {children}
    </header>
  );
}
