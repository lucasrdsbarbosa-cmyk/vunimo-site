import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NucleusCards } from "@/components/NucleusCards";
import { UrgentHelp } from "@/components/UrgentHelp";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Como você quer começar?" };

export default async function StartPage() {
  const user = await getCurrentUser();
  if (user?.role === "youth") redirect("/app");

  return (
    <div className="grid gap-10">
      <div>
        <p className="text-lg text-muted">Seu tempo. Seu próximo passo.</p>
        <h1 className="mt-1 text-[2.4rem] leading-tight sm:text-5xl">Como você quer começar?</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Escolha um caminho para agora. Se não souber, comece pela Pausa — leva um minuto.
        </p>
      </div>
      <NucleusCards />
      <UrgentHelp tone="card" />
      <section className="rounded-[var(--radius-card)] bg-nevoa p-6">
        <h2 className="text-xl">Quer guardar o que escrever e voltar depois?</h2>
        <p className="mt-1 text-muted">
          Com uma conta você tem diário privado, conversa com a IA e pode pedir apoio a profissionais.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/cadastro" className="btn btn-primary">
            Criar conta
          </Link>
          <Link href="/entrar" className="btn btn-secondary">
            Entrar
          </Link>
        </div>
      </section>
    </div>
  );
}
