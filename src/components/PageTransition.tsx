import { ViewTransition, type ReactNode } from "react";

/** Entrada suave a cada troca de página (sobe e aparece). Desligada com movimento reduzido via CSS. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="vn-page-in" exit="vn-page-out" default="none">
      {children}
    </ViewTransition>
  );
}
