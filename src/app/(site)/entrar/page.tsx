import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/entrar">) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-16">
      <div>
        <h1 className="text-4xl">Que bom te ver de novo</h1>
        <p className="mt-3 text-lg text-muted">
          Entre para continuar de onde parou: seu diário, sua conversa e seus pedidos de apoio ficam salvos.
        </p>
        {nextPath ? (
          <p className="mt-6 rounded-xl bg-nevoa px-4 py-3">
            Essa parte guarda informações suas, por isso precisa de conta.
          </p>
        ) : null}
        <p className="mt-6 text-muted">
          Quer só respirar um pouco ou saber o que fazer?{" "}
          <Link href="/comecar" className="link">
            Continue sem conta
          </Link>
          .
        </p>
      </div>
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 sm:p-8">
        <LoginForm next={nextPath} />
        <div className="mt-6 grid gap-2 border-t border-line pt-5 text-[0.97rem]">
          <p>
            Ainda não tem conta?{" "}
            <Link href={nextPath ? `/cadastro?next=${encodeURIComponent(nextPath)}` : "/cadastro"} className="link">
              Criar conta
            </Link>
          </p>
          <p>
            É profissional de saúde?{" "}
            <Link href="/profissionais/cadastro" className="link">
              Cadastre-se aqui
            </Link>
          </p>
          <p className="text-sm text-muted">
            Esqueceu a senha? Nesta versão de testes, a recuperação ainda não está disponível.
          </p>
        </div>
      </div>
    </div>
  );
}
