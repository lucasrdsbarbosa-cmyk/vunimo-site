"use client";

import Link from "next/link";
import { useRef } from "react";
import { SUPPORT_CHANNELS, URGENT_CHANNELS } from "@/lib/content";
import { Icon } from "./Icons";

/** Troca a página por um site neutro, sem deixar a Vunimo no botão Voltar. */
export function quickExit() {
  window.location.replace("https://www.google.com/search?q=previs%C3%A3o+do+tempo");
}

/**
 * "Ajuda e segurança": substitui a antiga faixa escura. Fica no topo de todas as páginas,
 * abre um painel acessível (dialog nativo: foco preso, Esc fecha) e funciona sem conta.
 */
export function HelpMenu({ compact = false, tone = "light" }: { compact?: boolean; tone?: "light" | "iris" }) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-haspopup="dialog"
        className={`vn-press group inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 text-[0.95rem] font-semibold ${
          tone === "iris"
            ? "bg-white/15 text-white hover:bg-white/25"
            : "bg-alerta-bg text-alerta hover:bg-[#f7dcd7]"
        }`}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <Icon name="shield" className="h-5 w-5" />
        </span>
        <span className={compact ? "sr-only sm:not-sr-only" : ""}>Ajuda e segurança</span>
      </button>

      <dialog
        ref={ref}
        aria-labelledby="help-title"
        className="vn-sheet"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5 sm:px-6">
            <div>
              <h2 id="help-title" className="text-2xl">
                Ajuda e segurança
              </h2>
              <p className="mt-1 text-muted">Não precisa de conta. Os números são gratuitos.</p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="vn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nevoa"
            >
              <Icon name="close" className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-5 sm:px-6">
            <h3 className="font-semibold text-alerta">Se você corre risco agora</h3>
            <ul className="mt-3 grid gap-2">
              {URGENT_CHANNELS.map((c) => (
                <li key={c.name}>
                  <a
                    href={c.href}
                    className="vn-press flex min-h-14 items-center gap-3 rounded-2xl bg-alerta-bg px-4 py-2 hover:bg-[#f7dcd7]"
                  >
                    <Icon name="phone" className="h-5 w-5 shrink-0 text-alerta" />
                    <span className="flex-1">
                      <span className="font-semibold">{c.name}</span>
                      <span className="block text-sm text-muted">{c.detail}</span>
                    </span>
                    <span className="text-xl font-semibold text-alerta">{c.contact}</span>
                  </a>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 font-semibold">Outros caminhos de apoio</h3>
            <ul className="mt-3 grid gap-2">
              {SUPPORT_CHANNELS.slice(1).map((c) => (
                <li key={c.name} className="rounded-2xl border border-line px-4 py-3">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-muted">{c.detail}</p>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="link mt-1 inline-block text-sm"
                      {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {c.contact}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-semibold">{c.contact}</p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl bg-nevoa p-4">
              <h3 className="font-semibold">Usando um celular ou computador compartilhado?</h3>
              <p className="mt-1 text-sm text-muted">
                O botão abaixo troca esta página por um site comum e não deixa a Vunimo no botão Voltar. Se tiver conta,
                lembre de sair ao terminar.
              </p>
              <button type="button" onClick={quickExit} className="btn btn-primary vn-press mt-3 w-full sm:w-auto">
                <Icon name="logout" className="h-5 w-5" />
                Sair rápido
              </button>
            </div>

            <Link
              href="/conectar#canais"
              onClick={() => ref.current?.close()}
              className="link mt-5 inline-flex min-h-11 items-center"
            >
              Ver todos os caminhos de apoio
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
