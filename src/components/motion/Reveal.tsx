"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { fadeUp, inViewOnce, staggerGroup } from "@/lib/motion";

type Tag = "div" | "section" | "ul" | "ol" | "li" | "article" | "aside";
const TAGS = {
  div: motion.div,
  section: motion.section,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  article: motion.article,
  aside: motion.aside,
} as const;

type Props = { as?: Tag; className?: string; style?: CSSProperties; children: ReactNode; id?: string };

/** Bloco que sobe e aparece quando entra na tela (uma vez). */
export function Reveal({ as = "div", ...rest }: Props) {
  const C = TAGS[as];
  return <C initial="hidden" whileInView="show" viewport={inViewOnce} variants={fadeUp} {...rest} />;
}

/**
 * Lista que revela os itens em sequência quando entra na tela. Use com RevealItem.
 * `still`: mostra sem animar (ex.: a mesma lista reaparece a cada navegação).
 */
export function RevealGroup({ as = "ul", step = 0.06, still = false, ...rest }: Props & { step?: number; still?: boolean }) {
  const C = TAGS[as];
  if (still) return <C {...rest} />;
  return <C initial="hidden" whileInView="show" viewport={inViewOnce} variants={staggerGroup(step)} {...rest} />;
}

/** Item de um RevealGroup. */
export function RevealItem({ as = "li", ...rest }: Props) {
  const C = TAGS[as];
  return <C variants={fadeUp} {...rest} />;
}
