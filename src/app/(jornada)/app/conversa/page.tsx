import type { Metadata } from "next";
import Link from "next/link";
import { getMyConversation, getMyJournalEntry, getMyLatestConversation, listMyConversations } from "@/lib/dal";
import { aiConfigured } from "@/lib/ai/provider";
import { formatDate } from "@/lib/format";
import { deleteChat } from "@/app/actions/youth";
import { PageTitle } from "@/components/PageTitle";
import { Notice } from "@/components/Notice";
import { TrackVisit } from "@/components/TrackVisit";
import { ConfirmSubmit } from "@/components/Form";
import { ChatPanel } from "./ChatPanel";
import { NewChatLink } from "./NewChatLink";

export const metadata: Metadata = { title: "Conversa com IA" };

export default async function ChatPage({ searchParams }: PageProps<"/app/conversa">) {
  const params = await searchParams;
  const pick = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : null);
  const entryId = pick(params.diario);
  const wantsNew = Boolean(params.nova) || Boolean(entryId);
  const chosen = pick(params.c);

  const [list, entry] = await Promise.all([listMyConversations(), entryId ? getMyJournalEntry(entryId) : null]);
  const conversation = chosen ? await getMyConversation(chosen) : wantsNew ? null : await getMyLatestConversation();
  const messages = conversation?.messages ?? [];
  const configured = aiConfigured();

  // "Conversar sobre este registro" no diário: o texto entra na caixa para a pessoa revisar antes de enviar.
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
            É uma conversa com o Claude, uma inteligência artificial da Anthropic.{" "}
            <strong className="font-semibold text-grafite">Não é atendimento profissional.</strong>
          </>
        }
        aside={<span className="rounded-full bg-nevoa px-4 py-1.5 font-semibold text-iris">IA</span>}
      />

      <div className="mb-4 grid gap-3">
        {params.apagada ? <Notice>Conversa apagada.</Notice> : null}
        {params.limpa ? <Notice>Conversas apagadas.</Notice> : null}
        {chosen && !conversation ? <Notice tone="info">Essa conversa não existe mais. Comece uma nova abaixo.</Notice> : null}
        {!configured ? (
          <Notice tone="info">
            <strong>Modo de teste:</strong> o Claude ainda não está ligado, então as respostas são automáticas e simples
            (não leem de verdade o que você escreve).
          </Notice>
        ) : null}
        {entry ? (
          <Notice tone="info">
            O texto do seu diário está na caixa de mensagem. Revise ou apague o que não quiser compartilhar com a IA antes
            de enviar.
          </Notice>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <aside aria-label="Suas conversas" className="order-2 lg:order-1">
          <NewChatLink current={!conversation} />
          {list.length > 0 ? (
            <>
              <p className="mt-5 px-1 text-sm font-semibold text-muted">Conversas anteriores</p>
              <ul className="mt-2 grid gap-1">
                {list.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/app/conversa?c=${c.id}`}
                      aria-current={conversation?.id === c.id ? "page" : undefined}
                      className={`block rounded-xl px-3 py-2.5 ${
                        conversation?.id === c.id ? "bg-white font-semibold text-iris" : "hover:bg-white/70"
                      }`}
                    >
                      <span className="block truncate">{c.preview || "Conversa"}</span>
                      <span className="text-sm font-normal text-muted">
                        {formatDate(c.updatedAt)} · {c.count} {c.count === 1 ? "mensagem" : "mensagens"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>

        <div className="order-1 min-w-0 lg:order-2">
          <ChatPanel
            key={conversation?.id ?? `nova-${pick(params.nova) ?? ""}-${entry?.id ?? ""}`}
            conversationId={conversation?.id ?? null}
            messages={messages.map(({ id, role, content }) => ({ id, role, content }))}
            initialDraft={initialDraft}
            configured
          />
          {conversation && messages.length > 0 ? (
            <form action={deleteChat} className="mt-8 border-t border-line pt-5">
              <input type="hidden" name="id" value={conversation.id} />
              <ConfirmSubmit confirmText="Apagar esta conversa com a IA? Não dá para desfazer." className="btn btn-danger">
                Apagar esta conversa
              </ConfirmSubmit>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
