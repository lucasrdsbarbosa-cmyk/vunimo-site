import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { NucleusCards } from "@/components/NucleusCards";
import { TrackVisit } from "@/components/TrackVisit";
import { Breathing } from "./Breathing";

export const metadata: Metadata = { title: "Pausa" };

export default function PausePage() {
  return (
    <div>
      <TrackVisit path="/pausa" />
      <PageTitle title="Uma pausa, no seu tempo." subtitle="Antes de responder ou decidir qualquer coisa, respire." />
      <section aria-label="Respiração guiada" className="rounded-[2rem] bg-white p-6 sm:p-10">
        <Breathing />
      </section>
      <section aria-labelledby="depois" className="mt-10">
        <h2 id="depois" className="text-2xl">
          E depois?
        </h2>
        <p className="mb-4 mt-1 text-muted">Escolha o que fizer mais sentido agora.</p>
        <NucleusCards exclude="pausa" highlight="desabafar" />
      </section>
    </div>
  );
}
