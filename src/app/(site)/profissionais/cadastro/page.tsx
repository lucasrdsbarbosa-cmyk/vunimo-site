import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/session";
import { ProfessionalSignupForm } from "./ProfessionalSignupForm";

export const metadata: Metadata = { title: "Cadastro de profissional" };

export default async function ProfessionalSignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_1.6fr] md:py-16">
      <div>
        <Link href="/profissionais" className="link text-sm">
          Como funciona a participação
        </Link>
        <h1 className="mt-3 text-4xl">Cadastro de profissional de saúde</h1>
        <p className="mt-3 text-lg text-muted">
          Depois do envio, a equipe confere seu registro. Até lá, seu perfil não aparece para os jovens.
        </p>
        <p className="mt-6 text-muted">
          Já se cadastrou?{" "}
          <Link href="/entrar?next=/pro" className="link">
            Entrar
          </Link>
        </p>
      </div>
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 sm:p-8">
        <ProfessionalSignupForm />
      </div>
    </div>
  );
}
