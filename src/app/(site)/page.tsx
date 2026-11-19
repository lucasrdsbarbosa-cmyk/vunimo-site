import Link from "next/link";
import { HeroScene } from "@/components/home/HeroScene";
import { Icon, type IconName } from "@/components/Icons";
import { Notice } from "@/components/Notice";
import { VunimoSymbol } from "@/components/Logo";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { getCurrentUser, homeFor } from "@/lib/session";

const TOOLS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "evidence",
    title: "Linha do tempo",
    text: "Organize o que aconteceu: quando, onde, quem e se você guardou print. Ajuda a lembrar e a pedir ajuda.",
  },
  {
    icon: "check",
    title: "Plano de próximos passos",
    text: "Responda quatro perguntas e receba um checklist do que fazer agora, com o passo a passo de cada item.",
  },
  {
    icon: "flag",
    title: "Rascunho de denúncia",
    text: "Monte um texto claro para a plataforma, a escola ou um adulto, a partir da sua linha do tempo. Você revisa e decide.",
  },
];

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const account = user ? { href: homeFor(user.role), label: "Minha área" } : null;

  return (
    <>
      {params.saiu || params["conta-apagada"] ? (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <Notice>
            {params.saiu ? "Você saiu da sua conta." : "Sua conta e todos os seus dados foram apagados."}
          </Notice>
        </div>
      ) : null}

      <HeroScene account={account} />

      {/* Ferramentas para quando acabou de acontecer */}
      <section aria-labelledby="ferramentas" className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
        <Reveal className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-lg text-muted">Com uma conta</p>
            <h2 id="ferramentas" className="mt-1 text-3xl sm:text-5xl">
              Ferramentas para quando acabou de acontecer
            </h2>
          </div>
          <p className="text-lg text-muted">
            Tudo fica guardado só para você. Nada vai para outra pessoa sem você escolher — nem para profissionais.
          </p>
        </Reveal>
        <RevealGroup className="mt-10 grid gap-4 md:grid-cols-3" step={0.08}>
          {TOOLS.map((t) => (
            <RevealItem key={t.title} className="vn-card rounded-[var(--radius-card)] border border-line bg-white p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lima">
                <Icon name={t.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-xl">{t.title}</h3>
              <p className="mt-2 text-muted">{t.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* IA e profissionais */}
      <RevealGroup as="section" className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:px-6 md:grid-cols-2" step={0.1}>
        <RevealItem as="article" className="rounded-[var(--radius-card)] bg-nevoa p-6 sm:p-8">
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-iris">IA</span>
          <h2 className="mt-4 text-2xl">Onde a inteligência artificial entra</h2>
          <p className="mt-3 text-grafite/85">
            Só quando você pede, e sempre identificada como IA: na conversa do Desabafar e para deixar um rascunho de
            denúncia mais claro. Ela não é atendimento profissional e não envia nada por você.
          </p>
        </RevealItem>
        <RevealItem as="article" className="rounded-[var(--radius-card)] border border-line bg-white p-6 sm:p-8">
          <span className="inline-flex rounded-full bg-lima px-3 py-1 text-sm font-semibold text-grafite">
            Profissionais
          </span>
          <h2 className="mt-4 text-2xl">Pessoas de verdade, quando você quiser</h2>
          <p className="mt-3 text-grafite/85">
            Profissionais de saúde com registro conferido pela equipe aparecem no Apoio. Eles só veem o que você
            escolher enviar — nunca o diário, a conversa com a IA ou a sua linha do tempo inteira.
          </p>
          <Link href="/profissionais" className="link mt-4 inline-block">
            Sou profissional de saúde e quero participar
          </Link>
        </RevealItem>
      </RevealGroup>

      {/* Chamada final */}
      <section className="px-3 pb-3">
        <Reveal className="on-iris relative mx-auto grid max-w-[calc(72rem+24px)] overflow-hidden rounded-[2rem] bg-iris px-6 py-14 text-white sm:px-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl">
              Seu tempo.
              <br />
              Seu próximo passo.
            </h2>
            <span aria-hidden="true" className="mt-6 block h-1.5 w-28 rounded-full bg-lima" />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/comecar" className="btn btn-lima vn-press px-7">
                Começar agora
              </Link>
              {account ? (
                <Link href={account.href} className="btn vn-press bg-white px-7 text-iris">
                  {account.label}
                </Link>
              ) : (
                <Link href="/cadastro" className="btn vn-press bg-white px-7 text-iris">
                  Criar conta
                </Link>
              )}
            </div>
          </div>
          <VunimoSymbol variant="lima" className="mt-10 h-32 w-32 md:mt-0 md:h-44 md:w-44" />
        </Reveal>
      </section>
    </>
  );
}
