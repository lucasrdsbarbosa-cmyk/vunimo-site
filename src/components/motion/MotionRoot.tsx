"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { spring } from "@/lib/motion";

/**
 * Configuração única do Motion: com "reduzir movimento" no sistema, deslocamentos e animações de layout
 * são desligados (cores e opacidade continuam, mais curtas). A abertura da página inicial usa GSAP e não passa por aqui.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={spring.gentle}>
      {children}
    </MotionConfig>
  );
}
