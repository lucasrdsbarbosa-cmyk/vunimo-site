import Link from "next/link";

/**
 * Traços originais do símbolo, extraídos do PDF "Vunimo Identidade" (página do símbolo,
 * caixa 1024×1024, traço de 97,2 com pontas e junções arredondadas). Coordenadas convertidas
 * para o eixo do SVG (y para baixo). Não esticar, fechar os intervalos ou girar os módulos.
 */
export const SYMBOL_VIEWBOX = "272 272 480 480";
export const SYMBOL_STROKE = 97.2;
export const SYMBOL_PATH_A = "M355.4 593V474.2C355.4 387.8 420.2 323 506.6 323H571.4";
export const SYMBOL_PATH_B = "M668.6 431V549.8C668.6 636.2 603.8 701 517.4 701H452.6";

type SymbolProps = {
  className?: string;
  /** positivo (íris), negativo (branco + lima), lima ou uma cor (currentColor). */
  variant?: "positive" | "negative" | "lima" | "mono";
  title?: string;
};

export function symbolColors(variant: SymbolProps["variant"]): [string, string] {
  if (variant === "negative") return ["#ffffff", "var(--color-lima)"];
  if (variant === "lima") return ["var(--color-lima)", "var(--color-lima)"];
  if (variant === "mono") return ["currentColor", "currentColor"];
  return ["var(--color-iris)", "var(--color-iris)"];
}

/** Símbolo Vunimo: duas formas autônomas que abrem um espaço em comum. */
export function VunimoSymbol({ className, variant = "positive", title }: SymbolProps) {
  const [a, b] = symbolColors(variant);
  return (
    <svg
      viewBox={SYMBOL_VIEWBOX}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g fill="none" strokeWidth={SYMBOL_STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path className="shape-a" d={SYMBOL_PATH_A} stroke={a} />
        <path className="shape-b" d={SYMBOL_PATH_B} stroke={b} />
      </g>
    </svg>
  );
}

export function Logo({
  href = "/",
  variant = "positive",
  size = "md",
  dockTarget = false,
}: {
  href?: string;
  variant?: "positive" | "negative";
  size?: "sm" | "md";
  /** Marca o logo do topo como destino da palavra "vunimo" na abertura da página inicial. */
  dockTarget?: boolean;
}) {
  const text = variant === "negative" ? "text-white" : "text-iris";
  const dims = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const word = size === "sm" ? "text-[1.45rem]" : "text-[1.7rem]";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 ${text}`}
      aria-label="Vunimo, página inicial"
      data-header-logo={dockTarget ? "" : undefined}
    >
      <VunimoSymbol className={dims} variant={variant} />
      <span className={`${word} font-normal leading-none tracking-[-0.01em]`}>vunimo</span>
    </Link>
  );
}
