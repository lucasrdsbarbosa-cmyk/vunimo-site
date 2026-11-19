import type { Metadata } from "next";
import { getMyJournalEntry, getMyLatestConversation } from "@/lib/dal";
import { aiConfigured } from "@/lib/ai/provider";
import { clearChat } from "@/app/actions/youth";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { TrackVisit } from "@/components/TrackVisit";
import { ConfirmSubmit } from "@/components/Form";
import { ChatPanel } from "./ChatPanel";

export const metadata: Metadata = { title: "Conversa com IA" };

export default async function ChatPage({ searchParams }: PageProps<"/app/conversa">) {
  const [conversation, params] = await Promise.all([getMyLatestConversation(), searchParams]);
  const messages = conversation?.messages ?? [];
  const demo = !aiConfigured();
  // "Conversar sobre este registro" no diário: o texto entra na caixa para a pessoa revisar antes de enviar.
  const entryId = typeof params.diario === "string" ? params.diario : null;
  const entry = entryId ? await getMyJournalEntry(entryId) : null;
  const initialDraft = entry
    ? `Escrevi isto no meu diário${entry.title ? ` ("${entry.title}")` : ""} e queria conversar sobre:\n\n${entry.body.slice(0, 1500)}`
    : "";

  return (
    <div>
      <TrackVisit path="/app/conversa" />
      <PageTitle
        title="Conversa com IA"
        back={{ href: "/desabafar", label: "Desabafar" }}
        subtitle={
          <>
            É uma conversa com inteligência artificial.{" "}
            <strong className="font-semibold text-grafite">Não é atendimento profissional.</strong>
          </>
        }
        aside={<span className="rounded-full bg-nevoa px-4 py-1.5 font-semibold text-iris">IA</span>}
      />
      <div className="mb-4 grid gap-3">
        {params.limpa ? <Notice>Conversa apagada.</Notice> : null}
        {demo ? (
          <Notice tone="info">
            Modo demonstração: a IA ainda não foi configurada, então as respostas são exemplos fixos.
          </Notice>
        ) : null}
      </div>
      {entry ? (
        <Notice tone="info">
          O texto do seu diário está na caixa de mensagem. Revise ou apague o que não quiser compartilhar com a IA antes
          de enviar.
        </Notice>
      ) : null}
      <ChatPanel
        key={entry?.id ?? "conversa"}
        messages={messages.map(({ id, role, content }) => ({ id, role, content }))}
        initialDraft={initialDraft}
      />
      {messages.length > 0 ? (
        <form action={clearChat} className="mt-8 border-t border-line pt-5">
          <ConfirmSubmit confirmText="Apagar toda a conversa com a IA? Não dá para desfazer." className="btn btn-danger">
            Apagar conversa
          </ConfirmSubmit>
        </form>
      ) : null}
    </div>
  );
}
