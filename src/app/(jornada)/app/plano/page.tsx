import type { Metadata } from "next";
import { getMyPlan } from "@/lib/dal-tools";
import { resetPlan } from "@/app/actions/tools";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { TrackVisit } from "@/components/TrackVisit";
import { ConfirmSubmit } from "@/components/Form";
import { UrgentHelp } from "@/components/UrgentHelp";
import { PlanForm } from "./PlanForm";
import { PlanChecklist } from "./PlanChecklist";

export const metadata: Metadata = { title: "Plano de próximos passos" };

export default async function PlanPage({ searchParams }: PageProps<"/app/plano">) {
  const [plan, params] = await Promise.all([getMyPlan(), searchParams]);

  return (
    <div className="max-w-3xl">
      <TrackVisit path="/app/plano" />
      <PageTitle
        title="Plano de próximos passos"
        subtitle={plan ? "Marque o que já fez. Dá para voltar quando quiser." : "Cinco perguntas rápidas e você recebe um checklist do que fazer agora."}
        back={{ href: "/app", label: "Minha área" }}
      />
      <div className="mb-6 grid gap-3">
        {params.pronto ? <Notice>Seu plano está pronto. Comece pelo primeiro passo.</Notice> : null}
        {params.refazer ? <Notice tone="info">Respostas apagadas. Responda de novo para montar outro plano.</Notice> : null}
      </div>

      {plan ? (
        <div className="grid gap-6">
          {plan.answers.risk === "sim" ? <UrgentHelp /> : null}
          <PlanChecklist steps={plan.steps} done={plan.done} />
          <form action={resetPlan} className="border-t border-line pt-5">
            <p className="mb-3 text-muted">A situação mudou? Responda as perguntas de novo.</p>
            <ConfirmSubmit confirmText="Apagar suas respostas e o progresso deste plano?" className="btn btn-secondary" pendingLabel="Apagando…">
              Refazer as perguntas
            </ConfirmSubmit>
          </form>
        </div>
      ) : (
        <PlanForm />
      )}
    </div>
  );
}
