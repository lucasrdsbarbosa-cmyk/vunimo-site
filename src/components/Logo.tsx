import Link from "next/link";

type SymbolProps = {
  className?: string;
  /** Cor de cada forma: positivo (íris), negativo (branco + lima) ou uma cor. */
  variant?: "positive" | "negative" | "lima" | "mono";
  title?: string;
};

/** Símbolo Vunimo: duas formas autônomas que abrem um espaço em comum. */
export function VunimoSymbol({ className, variant = "positive", title }: SymbolProps) {
  const colors =
    variant === "negative"
      ? ["#ffffff", "var(--color-lima)"]
      : variant === "lima"
        ? ["var(--color-lima)", "var(--color-lima)"]
        : variant === "mono"
          ? ["currentColor", "currentColor"]
          : ["var(--color-iris)", "var(--color-iris)"];
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g fill="none" strokeWidth="13" strokeLinecap="round">
        <path className="shape-a" d="M27 62V44a20 20 0 0 1 20-20h11" stroke={colors[0]} />
        <path className="shape-b" d="M73 38v18a20 20 0 0 1-20 20H42" stroke={colors[1]} />
      </g>
    </svg>
  );
}

export function Logo({
  href = "/",
  variant = "positive",
  size = "md",
}: {
  href?: string;
  variant?: "positive" | "negative";
  size?: "sm" | "md";
}) {
  const text = variant === "negative" ? "text-white" : "text-iris";
  const dims = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const word = size === "sm" ? "text-[1.45rem]" : "text-[1.8rem]";
  return (
    <Link href={href} className={`inline-flex items-center gap-2 ${text}`} aria-label="Vunimo, página inicial">
      <VunimoSymbol className={dims} variant={variant} />
      <span className={`${word} font-normal leading-none tracking-[-0.01em]`}>vunimo</span>
    </Link>
  );
}
