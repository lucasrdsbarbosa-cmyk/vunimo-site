import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Para profissionais de saúde" };

const STEPS = [
  {
    title: "Faça o cadastro",
    text: "Informe sua área, o número do registro no conselho, como você atende e uma apresentação curta para os jovens.",
  },
  {
    title: "A equipe confere seu registro",
    text: "Enquanto isso, seu perfil fica “em análise” e não aparece para ninguém. Você recebe o resultado no seu painel.",
  },
  {
    title: "Seu perfil entra no Apoio",
    text: "Aprovado, você aparece no diretório da Vunimo, com nome, área, registro, modalidade e apresentação. E-mail e dados de contato não são exibidos.",
  },
  {
    title: "Você recebe pedidos de apoio",
    text: "Um jovem escolhe você e envia uma mensagem. Você responde pela Vunimo com acolhimento e orientação sobre próximos passos, e encerra quando fizer sentido.",
  },
];

const RULES = [
  "Você só vê o que o jovem escolheu enviar para você. Diário, conversas com a IA e histórico de navegação nunca são compartilhados.",
  "A resposta é orientação inicial, não um atendimento clínico continuado. Encaminhe para serviços adequados quando necessário.",
  "Não peça dados pessoais, contato fora da plataforma ou pagamento.",
  "Em sinais de risco, oriente os canais de emergência (CVV 188, SAMU 192) e a busca por um adulto responsável.",
];

export default function ProfessionalsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-16">
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <p className="text-lg text-muted">Para profissionais de saúde</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Seja um ponto de apoio para quem está passando por isso agora</h1>
          <p className="mt-5 max-w-xl text-lg text-grafite/85">
            Psicólogas, psicólogos, médicos, assistentes sociais e outros profissionais de saúde podem participar da
            Vunimo respondendo a pedidos de apoio de adolescentes que sofrem ciberbullying.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
          <Link href="/profissionais/cadastro" className="btn btn-primary text-lg">
            Quero me cadastrar
          </Link>
          <Link href="/entrar?next=/pro" className="btn btn-secondary text-lg">
            Já tenho cadastro
          </Link>
        </div>
      </div>

      <section aria-labelledby="como-participar" className="mt-14">
        <h2 id="como-participar" className="text-3xl">Como participar</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-[var(--radius-card)] border border-line bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-nevoa font-semibold text-iris">
                {i + 1}
              </span>
              <h3 className="mt-4 text-xl">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="diretrizes" className="mt-14 rounded-[var(--radius-card)] bg-nevoa p-6 sm:p-10">
        <h2 id="diretrizes" className="text-3xl">Diretrizes de participação</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {RULES.map((r) => (
            <li key={r} className="rounded-2xl bg-white p-5">
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Projeto em desenvolvimento: a participação é voluntária nesta fase. Regras de verificação, termos e eventual
          remuneração ainda serão definidos pela equipe.
        </p>
      </section>
    </div>
  );
}
