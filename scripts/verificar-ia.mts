/**
 * Confere a integração REAL com a Anthropic usando a configuração do servidor (.env.local).
 * Uso: npm run ia:verificar
 * Mostra o modelo, o id da mensagem (msg_…) e os tokens — nunca a chave.
 */
import Anthropic from "@anthropic-ai/sdk";

const key = process.env.ANTHROPIC_API_KEY?.trim();
const model = process.env.AI_MODEL?.trim() || "claude-opus-5-5";

if (!key) {
  console.error("✗ ANTHROPIC_API_KEY não está definida (.env.local ou ambiente). Nada foi enviado.");
  process.exit(1);
}
console.log(`Chave encontrada (${key.length} caracteres, termina em …${key.slice(-4)}). Modelo: ${model}`);

// Endereço oficial fixo (ignora ANTHROPIC_BASE_URL herdado de outras ferramentas).
const client = new Anthropic({ apiKey: key, baseURL: "https://api.anthropic.com", maxRetries: 1 });
try {
  const info = await client.models.retrieve(model);
  console.log(`✓ Modelo disponível para a conta: ${info.id} (${info.display_name})`);
} catch (e) {
  console.error(`✗ O modelo ${model} não está disponível: ${(e as Error).message}`);
  process.exit(1);
}

try {
  const msg = await client.messages.create({
    model,
    max_tokens: 200,
    output_config: { effort: "low" },
    messages: [{ role: "user", content: "oi" }],
  });
  const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
  console.log(`✓ Resposta real recebida: id=${msg.id} modelo=${msg.model} entrada=${msg.usage.input_tokens} saída=${msg.usage.output_tokens}`);
  console.log(`  "oi" → ${text}`);
} catch (e) {
  console.error(`✗ Falha ao chamar a API: ${(e as Error).message}`);
  process.exit(1);
}
