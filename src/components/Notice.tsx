import type { ReactNode } from "react";

/** Aviso de confirmação ou erro exibido após um redirecionamento. */
export function Notice({ tone = "ok", children }: { tone?: "ok" | "error" | "info"; children: ReactNode }) {
  const styles =
    tone === "ok"
      ? "bg-ok-bg text-ok"
      : tone === "error"
        ? "bg-alerta-bg text-alerta"
        : "bg-nevoa text-grafite";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 font-semibold ${styles}`}>
      {children}
    </p>
  );
}
