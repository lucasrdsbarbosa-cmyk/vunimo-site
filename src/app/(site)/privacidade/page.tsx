import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacidade" };

/**
 * RASCUNHO para validação. Antes de publicar, revisar com apoio jurídico
 * (LGPD, art. 14 — dados de crianças e adolescentes).
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-16">
      <p className="rounded-xl bg-nevoa px-4 py-3 text-sm">
        Versão de testes. Este texto ainda será revisado antes de a Vunimo ser aberta ao público.
      </p>
      <h1 className="mt-6 text-4xl">Como seus dados são usados</h1>
      <div className="mt-6 grid gap-5 text-lg text-grafite/90">
        <section>
          <h2 className="text-2xl">O que pedimos</h2>
          <p className="mt-2">
            Um apelido, seu e-mail, uma senha e o ano em que você nasceu (para saber se você tem 13 anos ou mais). Não
            pedimos nome completo, telefone, endereço ou escola.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Quem vê o quê</h2>
          <ul className="mt-2 grid list-disc gap-2 pl-6">
            <li>Seu diário e suas conversas com a IA: só você.</li>
            <li>
              Um pedido de apoio: só o profissional que você escolheu, e só a mensagem que você escreveu e seu apelido.
            </li>
            <li>A equipe da Vunimo não lê seu diário nem suas conversas pela plataforma.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl">Conversa com IA</h2>
          <p className="mt-2">
            Quando você usa a conversa com IA, suas mensagens são enviadas a um provedor de inteligência artificial
            para gerar as respostas. Não escreva dados que identifiquem você ou outras pessoas.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Apagar tudo</h2>
          <p className="mt-2">
            Em Minha conta você pode apagar a conta a qualquer momento. Isso remove diário, conversas, progresso e
            pedidos.
          </p>
        </section>
      </div>
    </article>
  );
}
