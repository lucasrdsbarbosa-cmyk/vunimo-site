import { ViewTransition, type ReactNode } from "react";

/**
 * Entrada do conteúdo a cada troca de página.
 * - Troca de aba (links com transitionTypes "vn-forward"/"vn-back"): desliza para o lado da aba escolhida.
 * - Outras navegações: sobe e aparece.
 * Tudo desligado com movimento reduzido via CSS.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "vn-forward": "vn-slide-forward", "vn-back": "vn-slide-back", default: "vn-page-in" }}
      exit={{ "vn-forward": "vn-slide-forward", "vn-back": "vn-slide-back", default: "vn-page-out" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
