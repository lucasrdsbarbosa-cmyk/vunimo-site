"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { spring } from "@/lib/motion";

/**
 * Barra de navegação que acompanha a rolagem sem saltos:
 * - ganha fundo mais sólido e sombra assim que a página sai do topo;
 * - recolhe ao descer e volta ao rolar para cima (só deslocamento: a altura nunca muda);
 * - na página inicial, fica fixa durante toda a abertura animada;
 * - nunca recolhe com o menu aberto ou com o foco dentro dela.
 * A rolagem continua nativa: o Motion só observa a posição.
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
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const travel = useRef(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    const el = ref.current;
    if (!el) return;
    const dy = y - (scrollY.getPrevious() ?? y);
    setScrolled(y > 4);

    const hero = document.querySelector<HTMLElement>(".vn-hero");
    const spacer = hero?.parentElement?.classList.contains("pin-spacer") ? hero.parentElement : hero;
    const keepVisibleUntil = spacer ? spacer.getBoundingClientRect().bottom + y : 96;
    const locked = el.matches(":focus-within") || el.querySelector("[data-open]") !== null;
    if (locked || y < keepVisibleUntil) {
      travel.current = 0;
      setHidden(false);
      return;
    }
    // Pequenos tremores do trackpad não fazem a barra piscar: exige um trecho contínuo.
    travel.current = Math.sign(dy) === Math.sign(travel.current) ? travel.current + dy : dy;
    if (travel.current > 24) setHidden(true);
    else if (travel.current < -12) setHidden(false);
  });

  return (
    <motion.header
      ref={ref}
      className={`vn-autohide ${className ?? ""}`}
      style={style}
      data-hidden={hidden ? "" : undefined}
      data-scrolled={scrolled ? "" : undefined}
      initial={false}
      animate={{ y: hidden ? "-105%" : "0%" }}
      transition={spring.gentle}
    >
      {children}
    </motion.header>
  );
}
