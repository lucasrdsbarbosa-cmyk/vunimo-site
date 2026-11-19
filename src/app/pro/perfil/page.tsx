import type { Metadata } from "next";
import { getMyProfessionalProfile } from "@/lib/dal";
import { deleteProfessionalAccount } from "@/app/actions/pro";
import { logout } from "@/app/actions/auth";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/Form";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ProProfilePage({ searchParams }: PageProps<"/pro/perfil">) {
  const [profile, params] = await Promise.all([getMyProfessionalProfile(), searchParams]);
  const { email } = profile;
  const fields = {
    fullName: profile.fullName,
    profession: profile.profession,
    registryNumber: profile.registryNumber,
    registryState: profile.registryState,
    modality: profile.modality,
    city: profile.city,
    specialties: profile.specialties,
    bio: profile.bio,
  };
  return (
    <div className="grid max-w-3xl gap-8">
      <PageTitle title="Meu perfil" subtitle={`Acesso com ${email}. Seu e-mail não aparece no diretório.`} />
      <section className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
        <p className="mb-5 rounded-xl bg-nevoa px-4 py-3 text-[0.95rem]">
          Mudanças em nome, área ou registro levam o perfil de volta para análise.
        </p>
        <ProfileForm initial={fields} />
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
        <h2 className="text-xl">Sair</h2>
        <form action={logout} className="mt-3">
          <SubmitButton className="btn btn-secondary" pendingLabel="Saindo…">
            Sair da conta
          </SubmitButton>
        </form>
      </section>

      <section className="rounded-[var(--radius-card)] border border-alerta/30 bg-white p-6 sm:p-8">
        <h2 className="text-xl">Apagar cadastro</h2>
        <p className="mt-1 text-muted">Remove seu perfil do diretório e apaga os pedidos recebidos.</p>
        {params.erro ? (
          <div className="mt-3">
            <Notice tone="error">Para confirmar, digite APAGAR em letras maiúsculas.</Notice>
          </div>
        ) : null}
        <form action={deleteProfessionalAccount} className="mt-4 grid gap-3">
          <label htmlFor="confirm" className="font-semibold">
            Digite APAGAR para confirmar
          </label>
          <input id="confirm" name="confirm" className="field-input max-w-xs" autoComplete="off" />
          <div>
            <SubmitButton className="btn btn-danger" pendingLabel="Apagando…">
              Apagar meu cadastro
            </SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
