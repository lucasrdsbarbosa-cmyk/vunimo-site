import Link from "next/link";
import { URGENT_CHANNELS } from "@/lib/content";
import { Icon } from "./Icons";

/** Faixa sempre visível: quem está em risco não deve precisar procurar. */
export function UrgentHelp({ tone = "bar" }: { tone?: "bar" | "card" }) {
  if (tone === "card") {
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
                className="flex min-h-12 items-center gap-3 rounded-xl bg-white px-4 py-2 font-semibold text-grafite hover:bg-white/70"
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
  return (
    <div className="bg-grafite text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm sm:px-6">
        <span className="font-semibold">Precisa de ajuda agora?</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <a className="underline underline-offset-2" href="tel:188">CVV 188</a>
          <a className="underline underline-offset-2" href="tel:192">SAMU 192</a>
          <a className="underline underline-offset-2" href="tel:190">Polícia 190</a>
          <Link className="underline underline-offset-2" href="/conectar#canais">
            Outros canais
          </Link>
        </span>
      </div>
    </div>
  );
}
