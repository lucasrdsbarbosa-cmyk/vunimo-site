// SIMULAÇÃO da API da Anthropic, usada só nos testes automáticos (nunca no site real).
// Implementa POST /v1/messages com streaming (SSE) no mesmo formato da API oficial, para testar
// o caminho completo do chat sem gastar créditos. As respostas começam com "[simulação]" e
// repetem o que recebeu (mensagens e histórico), para os testes conferirem o que o servidor enviou.
// Gatilhos de falha (no texto da última mensagem):
//   #erro-401  → chave inválida        #erro-429 → limite de uso
//   #falha-uma-vez → 529 (sobrecarga) nas 3 primeiras tentativas com esse texto, depois responde
// Rotas de inspeção: GET /__log (pedidos recebidos), POST /__reset.
import http from "node:http";

const PORT = Number(process.env.MOCK_ANTHROPIC_PORT ?? 4010);
let log = [];
const attempts = new Map();

const textOf = (content) =>
  typeof content === "string" ? content : (content ?? []).map((b) => (b.type === "text" ? b.text : "")).join("");

function error(res, status, type, message) {
  res.writeHead(status, { "content-type": "application/json", "retry-after-ms": "20", "request-id": `req_sim_${Date.now()}` });
  res.end(JSON.stringify({ type: "error", error: { type, message } }));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/__log") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(log));
  }
  if (req.method === "POST" && req.url === "/__reset") {
    log = [];
    attempts.clear();
    res.writeHead(204);
    return res.end();
  }
  if (req.method !== "POST" || !req.url?.startsWith("/v1/messages")) {
    return error(res, 404, "not_found_error", "rota não simulada");
  }

  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw);
  const messages = (body.messages ?? []).map((m) => ({ role: m.role, text: textOf(m.content) }));
  const system = Array.isArray(body.system) ? body.system.map((b) => b.text).join("") : String(body.system ?? "");
  // O SDK envia a chave como "Authorization: Bearer …" (ou x-api-key, conforme a versão).
  const hasKey =
    req.headers["x-api-key"] === "chave-falsa-so-para-simulacao" ||
    req.headers.authorization === "Bearer chave-falsa-so-para-simulacao";
  log.push({ model: body.model, stream: Boolean(body.stream), hasKey, systemMentionsVunimo: system.includes("Vunimo"), messages });

  const last = messages.at(-1)?.text ?? "";
  if (last.includes("#erro-401")) return error(res, 401, "authentication_error", "invalid x-api-key");
  if (last.includes("#erro-429")) return error(res, 429, "rate_limit_error", "rate limited");
  if (last.includes("#falha-uma-vez")) {
    const n = (attempts.get(last) ?? 0) + 1;
    attempts.set(last, n);
    if (n <= 3) return error(res, 529, "overloaded_error", "Overloaded");
  }

  const users = messages.filter((m) => m.role === "user");
  const previous = users.length > 1 ? ` Mensagem anterior sua: "${users.at(-2).text}".` : "";
  const reply = `[simulação] Você disse: "${last}". Esta conversa tem ${messages.length} mensagem(ns).${previous}`;
  const id = `msg_sim_${Date.now()}`;

  if (!body.stream) {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(
      JSON.stringify({
        id, type: "message", role: "assistant", model: body.model, content: [{ type: "text", text: reply }],
        stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 },
      }),
    );
  }

  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
  const sse = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`);
  sse("message_start", {
    message: { id, type: "message", role: "assistant", model: body.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } },
  });
  sse("content_block_start", { index: 0, content_block: { type: "text", text: "" } });
  const parts = reply.match(/.{1,18}/gs) ?? [reply];
  for (const part of parts) {
    sse("content_block_delta", { index: 0, delta: { type: "text_delta", text: part } });
    await new Promise((r) => setTimeout(r, 150));
  }
  sse("content_block_stop", { index: 0 });
  sse("message_delta", { delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 20 } });
  sse("message_stop", {});
  res.end();
});

server.listen(PORT, "127.0.0.1", () => console.log(`[simulação Anthropic] ouvindo em http://127.0.0.1:${PORT}`));
