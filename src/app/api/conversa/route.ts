import { getCurrentUser } from "@/lib/session";
import {
  appendToMyConversation,
  createMyConversation,
  deleteMyConversation,
  getMyConversation,
  removeMyMessage,
} from "@/lib/dal";
import { rateLimit } from "@/lib/rate-limit";
import { aiConfigured, streamReply } from "@/lib/ai/provider";
import { hasRiskSignal } from "@/lib/ai/safety";
import { chatMessageSchema } from "@/lib/validation";

/**
 * Conversa com o Claude (API oficial da Anthropic), em tempo real.
 * Corpo: { message, conversationId? }. Sem conversationId, começa uma conversa nova.
 * Resposta em NDJSON (uma linha JSON por evento):
 *   {"type":"start","conversationId","risk"} → {"type":"delta","text"} … → {"type":"done","messageId"}
 *   ou {"type":"error","code","message","retryable"} — nesse caso a mensagem da pessoa é desfeita,
 *   para que "Tentar de novo" não duplique nada.
 * A chave da Anthropic fica só no servidor; o navegador recebe apenas o texto.
 */
export async function POST(request: Request) {
  // Só o próprio site pode chamar (proteção contra envio a partir de outra página).
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return Response.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para conversar." }, { status: 401 });
  if (user.role !== "youth") return Response.json({ error: "A conversa com IA é só para a área do jovem." }, { status: 403 });

  if (!aiConfigured()) {
    return Response.json(
      { error: "A conversa com IA ainda não foi configurada neste servidor (falta a chave da Anthropic).", code: "not_configured" },
      { status: 503 },
    );
  }

  let body: { message?: unknown; conversationId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Mensagem inválida." }, { status: 400 });
  }
  const parsed = chatMessageSchema.safeParse(body?.message);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  let conversationId = typeof body.conversationId === "string" && body.conversationId ? body.conversationId : null;
  let isNew = false;
  if (conversationId) {
    if (!(await getMyConversation(conversationId))) {
      return Response.json({ error: "Conversa não encontrada." }, { status: 404 });
    }
  } else {
    conversationId = await createMyConversation();
    isNew = true;
  }

  if (!rateLimit(`chat:${user.id}`, 30, 60 * 60 * 1000)) {
    if (isNew) await deleteMyConversation(conversationId);
    return Response.json(
      { error: "Você chegou ao limite de 30 mensagens por hora. Que tal uma Pausa ou escrever no diário enquanto isso?" },
      { status: 429 },
    );
  }

  const risk = hasRiskSignal(parsed.data);
  const userMessageId = await appendToMyConversation(conversationId, "user", parsed.data, risk);
  // Histórico só desta conversa: as outras ficam separadas.
  const conv = await getMyConversation(conversationId);
  const history = (conv?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));
  const convId = conversationId;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          /* a pessoa saiu da página */
        }
      };
      send({ type: "start", conversationId: convId, risk });
      const reply = await streamReply(history, (text) => send({ type: "delta", text }), request.signal);
      if (reply.ok) {
        const messageId = await appendToMyConversation(convId, "assistant", reply.text);
        send({ type: "done", messageId, userMessageId });
      } else {
        // Desfaz a mensagem da pessoa: ao tentar de novo, ela é enviada uma única vez.
        await removeMyMessage(convId, userMessageId);
        if (isNew) await deleteMyConversation(convId);
        send({ type: "error", code: reply.code, message: reply.message, retryable: reply.retryable, conversationGone: isNew });
      }
      try {
        controller.close();
      } catch {
        /* já fechado */
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
