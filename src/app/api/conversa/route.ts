import { getCurrentUser } from "@/lib/session";
import { appendToMyConversation, ensureMyConversation, getMyLatestConversation } from "@/lib/dal";
import { rateLimit } from "@/lib/rate-limit";
import { streamReply } from "@/lib/ai/provider";
import { hasRiskSignal } from "@/lib/ai/safety";
import { chatMessageSchema } from "@/lib/validation";

/**
 * Conversa com IA em tempo real.
 * Recebe { message } e responde em NDJSON (uma linha JSON por evento):
 *   {"type":"start","risk":bool}  → {"type":"delta","text":"…"} … → {"type":"done","mode":"ai"|"demo"}
 *   ou {"type":"error","message":"…"}
 * Só o próprio jovem logado usa; a conversa é gravada pela camada de dados (filtrada pelo dono).
 */
export async function POST(request: Request) {
  // Mesmo site apenas (proteção contra envio a partir de outra página).
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return Response.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta para conversar." }, { status: 401 });
  if (user.role !== "youth") return Response.json({ error: "A conversa com IA é só para a área do jovem." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Mensagem inválida." }, { status: 400 });
  }
  const parsed = chatMessageSchema.safeParse((body as { message?: unknown })?.message);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  if (!rateLimit(`chat:${user.id}`, 30, 60 * 60 * 1000)) {
    return Response.json(
      { error: "Você chegou ao limite de mensagens por hora. Que tal uma Pausa ou escrever no diário enquanto isso?" },
      { status: 429 },
    );
  }

  const risk = hasRiskSignal(parsed.data);
  const conversationId = await ensureMyConversation();
  await appendToMyConversation(conversationId, "user", parsed.data, risk);
  const conv = await getMyLatestConversation();
  const history = (conv?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          /* a pessoa saiu da página; a resposta ainda é gravada */
        }
      };
      send({ type: "start", risk });
      const reply = await streamReply(history, (text) => send({ type: "delta", text }), request.signal);
      if (reply.mode === "unavailable") {
        send({ type: "error", message: reply.text });
      } else {
        if (reply.text) await appendToMyConversation(conversationId, "assistant", reply.text);
        send({ type: "done", mode: reply.mode });
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
