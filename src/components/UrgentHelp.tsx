import { URGENT_CHANNELS } from "@/lib/content";
import { Icon } from "./Icons";

/** Cartão de ajuda imediata, mostrado em contextos de risco (conversa com IA, Apoio, Começar). */
export function UrgentHelp() {
  return (
    <section
      aria-labelledby="ajuda-agora"
      className="rounded-[var(--radius-card)] border border-alerta/25 bg-alerta-bg p-5 sm:p-6"
    >
      <h2 id="ajuda-agora" className="text-lg text-alerta">
        Se você corre risco agora, não espere
      </h2>
      <p className="mt-1 text-[0.95rem] text-grafite">
        Ligue para um destes números ou procure um adulto de confiança perto de você.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {URGENT_CHANNELS.map((c) => (
          <li key={c.name}>
            <a
              href={c.href}
              className="flex min-h-12 items-center gap-3 rounded-xl bg-white px-4 py-2 font-semibold text-grafite transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Icon name="phone" className="h-5 w-5 text-alerta" />
              <span>
                {c.name} <span className="text-alerta">{c.contact}</span>
                <span className="block text-xs font-normal text-muted">{c.detail}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
