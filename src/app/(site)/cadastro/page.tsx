import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/session";
import { Icon } from "@/components/Icons";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Criar conta" };

const WHAT_YOU_GET = [
  "Diário privado, só você lê",
  "Conversa com a IA salva para continuar depois",
  "Pedidos de apoio a profissionais de saúde",
  "A Vunimo lembra onde você parou",
];

export default async function SignupPage({ searchParams }: PageProps<"/cadastro">) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-16">
      <div>
        <h1 className="text-4xl">Crie sua conta</h1>
        <p className="mt-3 text-lg text-muted">Leva um minuto. Pedimos só o necessário.</p>
        <ul className="mt-6 grid gap-3">
          {WHAT_YOU_GET.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lima">
                <Icon name="check" className="h-4 w-4" />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-muted">
          Já tem conta?{" "}
          <Link href="/entrar" className="link">
            Entrar
          </Link>
        </p>
      </div>
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 sm:p-8">
        <SignupForm next={nextPath} />
      </div>
    </div>
  );
}
