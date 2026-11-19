import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { TopicList } from "@/components/TopicList";
import { TrackVisit } from "@/components/TrackVisit";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = { title: "Orientação" };

export default function GuidancePage() {
  return (
    <div>
      <TrackVisit path="/orientar" />
      <PageTitle title="Entenda o próximo passo." subtitle="Orientações práticas para redes sociais e jogos." />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section aria-label="Temas" className="rounded-[var(--radius-card)] bg-nevoa p-3 sm:p-4">
          <TopicList />
        </section>
        <aside className="h-fit rounded-[var(--radius-card)] border border-line bg-white p-6">
          <Icon name="info" className="h-6 w-6 text-iris" />
          <h2 className="mt-3 text-xl">Cada situação tem seu contexto</h2>
          <p className="mt-2 text-muted">
            Não precisa seguir uma ordem. Muita gente começa guardando evidências e depois bloqueia. Se estiver
            difícil decidir, conversar com um adulto de confiança ajuda.
          </p>
        </aside>
      </div>
    </div>
  );
}
