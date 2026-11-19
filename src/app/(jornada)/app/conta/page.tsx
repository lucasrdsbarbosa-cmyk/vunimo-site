import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { deleteAccount } from "@/app/actions/youth";
import { logout } from "@/app/actions/auth";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { NicknameForm } from "@/components/NicknameForm";
import { SubmitButton } from "@/components/Form";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage({ searchParams }: PageProps<"/app/conta">) {
  const [user, params] = await Promise.all([requireUser(["youth"], "/app/conta"), searchParams]);
  return (
    <div className="grid max-w-2xl gap-8">
      <PageTitle title="Minha conta" subtitle={`Conectado com ${user.email}`} />

      <section className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
        <h2 className="mb-4 text-xl">Como quer ser chamado(a)</h2>
        <NicknameForm current={user.displayName} />
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
        <h2 className="text-xl">Sair</h2>
        <p className="mt-1 text-muted">Se estiver num celular ou computador que outras pessoas usam, saia ao terminar.</p>
        <form action={logout} className="mt-4">
          <SubmitButton className="btn btn-secondary" pendingLabel="Saindo…">
            Sair da conta
          </SubmitButton>
        </form>
      </section>

      <section className="rounded-[var(--radius-card)] border border-alerta/30 bg-white p-6 sm:p-8">
        <h2 className="text-xl">Apagar conta</h2>
        <p className="mt-1 text-muted">
          Apaga para sempre seu diário, suas conversas com a IA, seu progresso e seus pedidos de apoio.
        </p>
        {params.erro ? (
          <div className="mt-3">
            <Notice tone="error">Para confirmar, digite APAGAR em letras maiúsculas.</Notice>
          </div>
        ) : null}
        <form action={deleteAccount} className="mt-4 grid gap-3">
          <label htmlFor="confirm" className="font-semibold">
            Digite APAGAR para confirmar
          </label>
          <input id="confirm" name="confirm" className="field-input max-w-xs" autoComplete="off" />
          <div>
            <SubmitButton className="btn btn-danger" pendingLabel="Apagando…">
              Apagar minha conta e meus dados
            </SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
