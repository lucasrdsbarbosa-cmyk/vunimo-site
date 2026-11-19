import type { Metadata } from "next";
import { listProfessionalsForReview } from "@/lib/dal";
import { reviewAction } from "@/app/actions/pro";
import { formatDate } from "@/lib/format";
import { MODALITY_LABEL } from "@/lib/content";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/Form";

export const metadata: Metadata = { title: "Profissionais" };

const BADGE = {
  pending: ["Em análise", "bg-lima text-grafite"],
  approved: ["Aprovado", "bg-ok-bg text-ok"],
  rejected: ["Não aprovado", "bg-alerta-bg text-alerta"],
} as const;

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const [pros, params] = await Promise.all([listProfessionalsForReview(), searchParams]);
  const pending = pros.filter((p) => p.status === "pending").length;

  return (
    <div>
      <PageTitle
        title="Cadastros de profissionais"
        subtitle={pending ? `${pending} aguardando análise.` : "Nenhum cadastro aguardando análise."}
      />
      <div className="mb-6 grid gap-3">
        {params.revisado === "approved" ? <Notice>Profissional aprovado e incluído no diretório.</Notice> : null}
        {params.revisado === "rejected" ? <Notice>Cadastro marcado como não aprovado.</Notice> : null}
        {params.erro ? <Notice tone="error">Cadastro não encontrado.</Notice> : null}
        {params.aviso === "sem-permissao" ? <Notice tone="error">Essa área não é da administração.</Notice> : null}
      </div>
      <p className="mb-6 rounded-xl bg-nevoa px-4 py-3 text-[0.95rem]">
        Confira o registro no site do conselho de classe antes de aprovar. A administração não tem acesso a diários,
        conversas ou pedidos.
      </p>
      <ul className="grid gap-4">
        {pros.map((p) => (
          <li key={p.id} className="rounded-[var(--radius-card)] border border-line bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl">{p.fullName}</h2>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${BADGE[p.status][1]}`}>
                {BADGE[p.status][0]}
              </span>
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-[0.95rem] sm:grid-cols-2">
              <div><dt className="inline font-semibold">Área: </dt><dd className="inline">{p.profession}</dd></div>
              <div><dt className="inline font-semibold">Registro: </dt><dd className="inline">{p.registry}</dd></div>
              <div><dt className="inline font-semibold">E-mail: </dt><dd className="inline">{p.email}</dd></div>
              <div><dt className="inline font-semibold">Atende: </dt><dd className="inline">{MODALITY_LABEL[p.modality]}{p.city ? ` · ${p.city}` : ""}</dd></div>
              <div className="sm:col-span-2"><dt className="inline font-semibold">Experiência: </dt><dd className="inline">{p.specialties}</dd></div>
            </dl>
            <p className="mt-3 text-muted">{p.bio}</p>
            <p className="mt-2 text-sm text-muted">Atualizado em {formatDate(p.updatedAt)}</p>

            <form action={reviewAction} className="mt-5 grid gap-3 border-t border-line pt-5">
              <input type="hidden" name="userId" value={p.id} />
              <label htmlFor={`note-${p.id}`} className="font-semibold">
                Observação para o profissional <span className="font-normal text-muted">(opcional)</span>
              </label>
              <input id={`note-${p.id}`} name="note" maxLength={300} autoComplete="off" defaultValue={p.reviewNote} className="field-input" />
              <div className="flex flex-col gap-3 sm:flex-row">
                {p.status !== "approved" ? (
                  <SubmitButton name="decision" value="approved" pendingLabel="Salvando…">
                    Aprovar
                  </SubmitButton>
                ) : null}
                {p.status !== "rejected" ? (
                  <SubmitButton name="decision" value="rejected" className="btn btn-danger" pendingLabel="Salvando…">
                    {p.status === "approved" ? "Remover do diretório" : "Não aprovar"}
                  </SubmitButton>
                ) : null}
              </div>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
