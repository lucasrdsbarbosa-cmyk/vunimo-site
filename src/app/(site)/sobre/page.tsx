import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sobre o projeto" };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-16">
      <p className="text-lg text-muted">Sobre o projeto</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Presença que abre caminhos</h1>
      <div className="mt-6 grid gap-5 text-lg text-grafite/90">
        <p>
          A vida também acontece online. 92% das pessoas de 9 a 17 anos no Brasil usam a internet (TIC Kids Online
          Brasil 2025), e 12,7% dos estudantes de 13 a 17 anos relataram bullying nas redes sociais (IBGE, PeNSE
          2024).
        </p>
        <p>
          A Vunimo organiza, em um só lugar, quatro caminhos para quem passa por isso: fazer uma pausa, colocar em
          palavras, entender o próximo passo e encontrar apoio. A pessoa escolhe por onde começar.
        </p>
        <h2 className="mt-4 text-2xl">O que a Vunimo é — e o que não é</h2>
        <ul className="grid list-disc gap-2 pl-6">
          <li>É um espaço de acolhimento e orientação para adolescentes de 13 a 17 anos.</li>
          <li>Não é serviço de emergência nem atendimento clínico. Em risco, ligue 188 (CVV) ou 192 (SAMU).</li>
          <li>Não promete resultados: oferece informação e caminhos para buscar ajuda.</li>
        </ul>
        <h2 className="mt-4 text-2xl">Projeto em desenvolvimento</h2>
        <p>
          Esta é uma versão de validação. Estamos medindo se a proposta é clara, onde surgem dúvidas de navegação e se
          as tarefas são concluídas. IA, armazenamento e moderação ainda passam por decisões de operação.
        </p>
      </div>
      <Link href="/comecar" className="btn btn-primary mt-10">
        Conhecer a jornada
      </Link>
    </article>
  );
}
