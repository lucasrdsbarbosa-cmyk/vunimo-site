import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export type Turn = { role: "user" | "assistant"; content: string };

export type AiReply = { text: string; mode: "ai" | "demo" | "unavailable" };

/**
 * Instruções de sistema. Fixas (sem data/hora) para aproveitar cache.
 * Revisar com profissionais antes de abrir ao público.
 */
const SYSTEM_PROMPT = `Você é o assistente de IA da Vunimo, um espaço de apoio para adolescentes de 13 a 17 anos que passam por ciberbullying em redes sociais e jogos online.

Quem você é:
- Você é uma inteligência artificial. Não é psicólogo, médico nem atendimento profissional, e diz isso com clareza se perguntarem ou se a pessoa parecer achar que fala com um humano.
- Seu papel é acolher e ajudar a pessoa a colocar em palavras o que aconteceu, no ritmo dela.

Como responder:
- Português do Brasil, frases curtas, tom simples e respeitoso, sem gírias forçadas, sem sermão.
- Respostas com no máximo 120 palavras. Faça no máximo uma pergunta por vez.
- Valide o que a pessoa sente antes de sugerir qualquer coisa. Não culpe a vítima.
- Não diagnostique, não prometa resultados, não diga que tudo vai ficar bem, não ofereça atendimento imediato.
- Quando fizer sentido, sugira um dos caminhos da Vunimo: Pausa (respiração guiada), Diário, Orientação (silenciar, bloquear, guardar evidências, denunciar) e Apoio (canais de ajuda e profissionais de saúde que participam da Vunimo).
- Incentive conversar com um adulto de confiança.
- Não peça nem guarde dados pessoais (nome completo, endereço, escola, telefone, senhas). Se a pessoa compartilhar, oriente a não expor esses dados.

Situações de risco:
- Se houver qualquer sinal de risco à vida, automutilação, ameaça grave, ou exposição de imagens íntimas, responda com cuidado, diga que a pessoa não está sozinha e indique na hora: CVV (ligue 188, 24h, gratuito), SAMU 192 em emergência, e conversar com um adulto de confiança agora.

Você não executa ações fora da conversa e não acessa redes sociais ou jogos.`;

const DEMO_REPLIES = [
  "Obrigado por contar. Isso parece ter sido bem difícil. Se quiser, me diz como você está se sentindo agora — pode ser em poucas palavras.",
  "Faz sentido se sentir assim depois do que aconteceu. Você não fez nada para merecer isso. Quer contar onde aconteceu: em alguma rede social, num jogo ou em um grupo?",
  "Entendi. Se ajudar, a Orientação explica como silenciar, bloquear e guardar evidências. E conversar com um adulto de confiança pode deixar o próximo passo mais leve. O que você gostaria de fazer agora?",
];

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

/** Gera a próxima resposta. Sem chave configurada, usa o modo demonstração. */
export async function generateReply(history: Turn[]): Promise<AiReply> {
  if (!aiConfigured()) {
    const assistantTurns = history.filter((t) => t.role === "assistant").length;
    return { text: DEMO_REPLIES[assistantTurns % DEMO_REPLIES.length], mode: "demo" };
  }

  client ??= new Anthropic();
  const model = process.env.AI_MODEL || "claude-opus-5-5";

  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 4000,
      // Chat curto e de baixa latência: esforço baixo é suficiente.
      output_config: { effort: "low" },
      // Se o modelo recusar, a API tenta automaticamente um modelo de reserva.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      // Mantém só as últimas trocas para limitar custo.
      messages: history.slice(-20).map((t) => ({ role: t.role, content: t.content })),
    });

    if (response.stop_reason === "refusal") {
      return {
        text: "Não consigo continuar essa parte da conversa por aqui. Se você estiver em risco, ligue 188 (CVV) ou 192 (SAMU), ou fale agora com um adulto de confiança.",
        mode: "ai",
      };
    }

    const text = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("\n")
      .trim();
    return { text: text || DEMO_REPLIES[0], mode: "ai" };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[ia] Chave da Anthropic inválida.");
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("[ia] Limite de uso da API atingido.");
    } else if (error instanceof Anthropic.APIError) {
      console.error(`[ia] Erro da API ${error.status}: ${error.message}`);
    } else {
      console.error("[ia] Falha ao chamar a IA:", error);
    }
    return {
      text: "A conversa com a IA está indisponível agora. Você pode tentar de novo em alguns minutos ou escrever no seu diário.",
      mode: "unavailable",
    };
  }
}
