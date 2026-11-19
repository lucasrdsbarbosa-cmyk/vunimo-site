import Link from "next/link";
import { VunimoSymbol } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icons";
import { Notice } from "@/components/Notice";
import { NUCLEI } from "@/lib/content";

const NUCLEUS_ICON: Record<string, IconName> = {
  pausa: "pause",
  desabafar: "chat",
  orientar: "compass",
  conectar: "people",
};

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  return (
    <>
      {params.saiu ? (
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Notice>Você saiu da sua conta.</Notice>
        </div>
      ) : null}
      {params["conta-apagada"] ? (
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Notice>Sua conta e todos os seus dados foram apagados.</Notice>
        </div>
      ) : null}

      {/* Abertura */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-16">
        <div>
          <p className="text-lg text-muted">Apoio para a vida online</p>
          <h1 className="mt-3 text-[2.6rem] leading-[1.05] sm:text-6xl">
            Aconteceu algo ruim nas redes ou num jogo?
          </h1>
          <p className="mt-5 max-w-xl text-xl text-grafite/85">
            Você não precisa ter todas as respostas agora. A Vunimo te ajuda a fazer uma pausa, colocar em palavras,
            entender o próximo passo e encontrar apoio — no seu tempo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/comecar" className="btn btn-primary px-7 text-lg">
              Começar agora
            </Link>
            <Link href="/entrar" className="btn btn-secondary px-7 text-lg">
              Já tenho conta
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            Não precisa de cadastro para a Pausa, a Orientação e os canais de apoio.
          </p>
        </div>

        <div className="on-iris relative overflow-hidden rounded-[2rem] bg-iris p-8 text-white sm:p-10">
          <VunimoSymbol variant="lima" className="ml-auto h-36 w-36 sm:h-44 sm:w-44" />
          <p className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl">
            Seu tempo.
            <br />
            Seu próximo passo.
          </p>
          <span aria-hidden="true" className="mt-6 block h-1.5 w-32 rounded-full bg-lima" />
          <p className="mt-6 max-w-xs text-white/90">
            12,7% dos estudantes de 13 a 17 anos relataram bullying nas redes sociais.
            <span className="mt-1 block text-sm text-white/75">IBGE, PeNSE 2024</span>
          </p>
        </div>
      </section>

      {/* Metodologia */}
      <section aria-labelledby="como-funciona" className="bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="como-funciona" className="text-3xl sm:text-4xl">
            Quatro caminhos. Você escolhe por onde começar.
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            Não existe ordem certa. Dá para fazer só uma pausa hoje e voltar outro dia — com conta, a Vunimo lembra
            onde você parou.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {NUCLEI.map((n) => (
              <li key={n.key}>
                <Link
                  href={n.href}
                  className="group flex h-full items-start gap-4 rounded-[var(--radius-card)] border border-line bg-papel p-5 transition-colors hover:border-iris sm:p-6"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nevoa text-iris">
                    <Icon name={NUCLEUS_ICON[n.key]} className="h-6 w-6" />
                  </span>
                  <span className="flex-1">
                    <span className="text-sm font-semibold text-iris">{n.step}</span>
                    <span className="block text-xl font-semibold">{n.name}</span>
                    <span className="mt-1 block text-muted">{n.description}</span>
                  </span>
                  <Icon name="arrow" className="mt-1 h-5 w-5 text-iris transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* IA e profissionais */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2">
        <article className="rounded-[var(--radius-card)] bg-nevoa p-6 sm:p-8">
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-iris">IA</span>
          <h2 className="mt-4 text-2xl">Onde a inteligência artificial entra</h2>
          <p className="mt-3 text-grafite/85">
            Só no Desabafar, e só se você quiser. O assistente se apresenta como IA, ajuda a organizar o que aconteceu e
            sugere caminhos. Ele não é atendimento profissional e não decide nada por você.
          </p>
          <p className="mt-3 text-grafite/85">
            Prefere não usar IA? O diário funciona sem ela.
          </p>
        </article>
        <article className="rounded-[var(--radius-card)] border border-line bg-white p-6 sm:p-8">
          <span className="inline-flex rounded-full bg-lima px-3 py-1 text-sm font-semibold text-grafite">
            Profissionais
          </span>
          <h2 className="mt-4 text-2xl">Pessoas de verdade, quando você quiser</h2>
          <p className="mt-3 text-grafite/85">
            Profissionais de saúde com registro conferido pela equipe aparecem no Apoio. Você pode mandar um pedido e
            receber uma orientação pela Vunimo. Eles nunca veem seu diário nem suas conversas com a IA.
          </p>
          <Link href="/profissionais" className="link mt-4 inline-block">
            Sou profissional de saúde e quero participar
          </Link>
        </article>
      </section>
    </>
  );
}
