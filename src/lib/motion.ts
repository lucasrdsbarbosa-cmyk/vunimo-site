import type { Transition, Variants } from "motion/react";

/**
 * Padrões de movimento da Vunimo (Motion). Todo componente animado usa estes valores,
 * para que durações, curvas e molas sejam as mesmas no site inteiro.
 * As curvas espelham as variáveis CSS --ease-out e --ease-spring de globals.css.
 */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

export const spring = {
  /** Indicadores de aba, item escolhido: chega rápido com um leve assentamento. */
  snappy: { type: "spring", bounce: 0.18, visualDuration: 0.35 },
  /** Painéis, alturas e entradas maiores: sem ultrapassar o alvo. */
  gentle: { type: "spring", bounce: 0, visualDuration: 0.4 },
  /** Resposta ao toque (ícones, confirmações): curta e viva. */
  pop: { type: "spring", bounce: 0.45, visualDuration: 0.3 },
} as const satisfies Record<string, Transition>;

export const fade: Transition = { duration: duration.base, ease: ease.out };

/** Entrada de conteúdo: sobe 12 px e aparece. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
};

/** Grupo que revela os filhos em sequência. */
export function staggerGroup(step = 0.06, delayChildren = 0): Variants {
  return { hidden: {}, show: { transition: { staggerChildren: step, delayChildren } } };
}

/** Revelação na rolagem: uma vez, quando 20% do bloco entra na tela. */
export const inViewOnce = { once: true, amount: 0.2 } as const;
