import Link from "next/link";
import { VunimoSymbol } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-4 text-center">
      <VunimoSymbol className="h-20 w-20" />
      <h1 className="mt-6 text-3xl">Esta página não existe</h1>
      <p className="mt-2 text-lg text-muted">O endereço pode ter mudado. Escolha um caminho para continuar.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/comecar" className="btn btn-primary">
          Como você quer começar?
        </Link>
        <Link href="/" className="btn btn-secondary">
          Página inicial
        </Link>
      </div>
    </main>
  );
}
