import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export type Turn = { role: "user" | "assistant"; content: string };

/**
 * Instruções do assistente da conversa. Fixas (sem data/hora) para aproveitar o cache de prompt.
 * Revisar com profissionais antes de abrir ao público.
 */
const SYSTEM_PROMPT = `Você é o assistente de IA da Vunimo, um espaço de apoio para adolescentes de 13 a 17 anos que passam por ciberbullying em redes sociais e jogos online. Você conversa pelo chat do site.

Como conversar:
- Responda em português do Brasil, de forma natural, como numa conversa de verdade. Tom simples e respeitoso, sem gírias forçadas, sem sermão.
- Seja proporcional à mensagem. Uma saudação ("oi", "tudo bem?") recebe uma saudação curta e amigável, com no máximo uma pergunta leve, sem textos longos nem listas. Perguntas simples recebem respostas curtas; assuntos difíceis podem ter um pouco mais.
- Responda ao que a pessoa realmente disse ou perguntou, de forma específica. Não use frases prontas nem repita sempre a mesma estrutura.
- Leve em conta toda a conversa até aqui: entenda continuações ("e se ele continuar?"), referências a mensagens anteriores e correções ("não, eu quis dizer...").
- Se a pessoa perguntar algo de outro assunto, responda de forma útil e breve; você não precisa trazer o tema do ciberbullying se ele não estiver na conversa.
- Faça no máximo uma pergunta por vez.

Quando o assunto for difícil:
- Valide o que a pessoa sente antes de sugerir algo. Não culpe a vítima.
- Não diagnostique, não prometa resultados e não diga que tudo vai ficar bem.
- Quando fizer sentido, sugira caminhos da Vunimo: Pausa (respiração guiada), Diário, Orientação (silenciar, bloquear, guardar evidências, denunciar) e Apoio (canais de ajuda e profissionais de saúde que participam da Vunimo). Incentive conversar com um adulto de confiança.

Seus limites (diga com clareza quando for relevante, sem fingir o contrário):
- Você é uma inteligência artificial. Não é psicólogo, médico nem atendimento profissional.
- Você não acessa a internet, redes sociais, jogos, prints ou perfis; só vê o texto desta conversa.
- Você não lembra de outras conversas, não envia mensagens, não faz denúncias e não contata ninguém.

Privacidade:
- Não peça dados pessoais (nome completo, endereço, escola, telefone, senhas). Se a pessoa compartilhar, oriente com gentileza a não expor esses dados.

Situações de risco:
- Se houver qualquer sinal de risco à vida, automutilação, ameaça grave ou exposição de imagens íntimas, responda com cuidado, diga que a pessoa não está sozinha e indique na hora: CVV (ligue 188, 24h, gratuito), SAMU 192 em emergência, e conversar com um adulto de confiança agora.`;

const REPORT_SYSTEM = `Você ajuda adolescentes a escrever denúncias de ciberbullying de forma clara.
Reescreva o rascunho recebido em português do Brasil:
- Mantenha TODOS os fatos, datas, horários, plataformas e nomes de usuário exatamente como estão. Não invente nada.
- Tom objetivo e respeitoso, frases curtas, em primeira pessoa (quem escreve é o adolescente).
- Organize: saudação, o que aconteceu (em ordem de data, em tópicos), o que a pessoa pede, despedida.
- Não acrescente dados pessoais (nome completo, escola, endereço, telefone) que não estejam no texto.
- Se houver lacunas entre colchetes, mantenha os colchetes.
Responda só com o texto final do rascunho, sem comentários.`;

const REPLY_SYSTEM = `Você ajuda profissionais de saúde voluntários da Vunimo a redigir uma primeira resposta a um adolescente (13–17 anos) que sofre ciberbullying.
Escreva um rascunho em português do Brasil, com no máximo 180 palavras:
- Acolha e valide o que a pessoa sente; não culpe a vítima.
- Ofereça 2 ou 3 próximos passos práticos (guardar evidências, bloquear/denunciar, conversar com um adulto de confiança).
- Não faça diagnóstico nem prometa resultados; não peça dados pessoais nem contato fora da plataforma.
- Se houver sinal de risco, oriente CVV 188 e SAMU 192 logo no início.
O profissional vai revisar e editar antes de enviar. Responda só com o rascunho.`;

/** A chave fica só no servidor (variável de ambiente); o navegador nunca a recebe. */
export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** Modelo usado (AI_MODEL no ambiente). Padrão: Claude Opus 5.5. */
export function chatModel(): string {
  return process.env.AI_MODEL?.trim() || "claude-opus-5-5";
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({
    // A chave vem só do ambiente do servidor (.env.local no computador, Environment no Render).
    apiKey: process.env.ANTHROPIC_API_KEY?.trim(),
    // Endereço oficial da API, fixo. Não usa ANTHROPIC_BASE_URL herdado de outras ferramentas;
    // AI_BASE_URL existe só para os testes automáticos apontarem para a simulação local.
    baseURL: process.env.AI_BASE_URL?.trim() || "https://api.anthropic.com",
    maxRetries: 2,
    timeout: 60_000,
  });
  return client;
}

export type AiFailure = { ok: false; code: string; message: string; retryable: boolean };
export type AiSuccess = { ok: true; text: string; model: string; messageId: string };

/** Traduz erros da API da Anthropic em mensagens claras (sem esconder que houve erro). */
export function describeAiError(error: unknown): AiFailure {
  const model = chatModel();
  if (error instanceof Anthropic.APIError) {
    const requestId = (error as { requestID?: string | null }).requestID ?? "";
    const raw = error.message ?? "";
    console.error(`[ia] erro da API status=${error.status ?? "?"} request_id=${requestId} detalhe=${raw.slice(0, 300)}`);
  } else {
    console.error("[ia] falha ao chamar a IA:", error);
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return { ok: false, code: "auth", retryable: false, message: "A chave da Anthropic configurada no servidor é inválida ou foi revogada." };
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return { ok: false, code: "permission", retryable: false, message: `A chave da Anthropic não tem permissão para usar o modelo ${model}.` };
  }
  if (error instanceof Anthropic.NotFoundError) {
    return { ok: false, code: "model", retryable: false, message: `O modelo ${model} não está disponível para esta conta. Confira AI_MODEL no servidor.` };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { ok: false, code: "rate_limit", retryable: true, message: "A conta da Anthropic atingiu o limite de uso. Tente de novo em instantes." };
  }
  if (error instanceof Anthropic.BadRequestError) {
    if (/credit balance/i.test(error.message)) {
      return { ok: false, code: "credits", retryable: false, message: "A conta da Anthropic está sem créditos. Adicione créditos em console.anthropic.com." };
    }
    return { ok: false, code: "bad_request", retryable: false, message: "A API da Anthropic recusou o pedido (erro 400). Os detalhes ficaram no registro do servidor." };
  }
  if (error instanceof Anthropic.InternalServerError) {
    return { ok: false, code: "overloaded", retryable: true, message: "A API da Anthropic está instável ou sobrecarregada agora. Tente de novo em instantes." };
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError || error instanceof Anthropic.APIConnectionError) {
    return { ok: false, code: "connection", retryable: true, message: "O servidor não conseguiu falar com a Anthropic. Tente de novo em instantes." };
  }
  if (error instanceof Anthropic.APIError) {
    return { ok: false, code: "api", retryable: true, message: `A API da Anthropic respondeu com erro ${error.status ?? ""}. Tente de novo.` };
  }
  return { ok: false, code: "unknown", retryable: true, message: "Algo deu errado ao gerar a resposta. Tente de novo." };
}

/**
 * Gera a próxima resposta da conversa em partes (streaming): `onText` recebe cada trecho assim que chega.
 * `history` é só a conversa atual (as outras ficam separadas). Sem chave, devolve falha "not_configured":
 * não há respostas prontas fingindo ser a IA.
 */
export async function streamReply(
  history: Turn[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<AiSuccess | AiFailure> {
  if (!aiConfigured()) {
    return {
      ok: false,
      code: "not_configured",
      retryable: false,
      message: "A conversa com IA ainda não foi configurada neste servidor (falta a chave da Anthropic).",
    };
  }

  try {
    const stream = getClient().messages.stream(
      {
        model: chatModel(),
        max_tokens: 2000,
        // Conversa curta e de baixa latência: esforço baixo basta.
        output_config: { effort: "low" },
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        // Histórico da conversa atual (as últimas 30 mensagens, para limitar custo).
        messages: history.slice(-30).map((t) => ({ role: t.role, content: t.content })),
      },
      { signal },
    );
    stream.on("text", (delta) => onText(delta));
    const final = await stream.finalMessage();
    console.info(
      `[ia] resposta ok model=${final.model} id=${final.id} entrada=${final.usage.input_tokens} saida=${final.usage.output_tokens} stop=${final.stop_reason}`,
    );
    if (final.stop_reason === "refusal") {
      return {
        ok: false,
        code: "refusal",
        retryable: false,
        message:
          "O Claude não continuou essa resposta. Se você estiver em risco, ligue 188 (CVV) ou 192 (SAMU), ou fale agora com um adulto de confiança.",
      };
    }
    const text = final.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();
    if (!text) return { ok: false, code: "empty", retryable: true, message: "A IA não devolveu texto desta vez. Tente de novo." };
    return { ok: true, text, model: final.model, messageId: final.id };
  } catch (error) {
    if (signal?.aborted) return { ok: false, code: "aborted", retryable: true, message: "Envio cancelado." };
    return describeAiError(error);
  }
}

export type AiTaskResult = { text: string; mode: "ai" | "demo" | "unavailable" };

async function runTask(system: string, input: string, maxTokens: number): Promise<AiTaskResult | null> {
  if (!aiConfigured()) return null;
  try {
    const response = await getClient().messages.create({
      model: chatModel(),
      max_tokens: maxTokens,
      output_config: { effort: "low" },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: input }],
    });
    if (response.stop_reason === "refusal") return { text: "", mode: "unavailable" };
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
    return text ? { text, mode: "ai" } : { text: "", mode: "unavailable" };
  } catch (error) {
    describeAiError(error);
    return { text: "", mode: "unavailable" };
  }
}

/** Deixa um rascunho de denúncia mais claro, sem mudar os fatos. */
export async function improveReportDraft(draft: string): Promise<AiTaskResult> {
  const result = await runTask(REPORT_SYSTEM, draft, 8000);
  if (result) return result;
  // Sem chave: só organiza o espaçamento, e a tela avisa que nada foi reescrito pela IA.
  const tidy = draft
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text: tidy, mode: "demo" };
}

/** Sugere um rascunho de resposta para o profissional revisar. */
export async function suggestProfessionalReply(request: { topic: string; message: string; attachment: string }): Promise<AiTaskResult> {
  const input = `Assunto: ${request.topic}\n\nMensagem do adolescente:\n${request.message}${
    request.attachment ? `\n\n${request.attachment}` : ""
  }`;
  const result = await runTask(REPLY_SYSTEM, input, 4000);
  if (result) return result;
  return {
    mode: "demo",
    text: `Oi! Obrigado(a) por confiar e escrever para mim. O que você está passando com "${request.topic.toLowerCase()}" não é culpa sua, e faz sentido se sentir assim.

Alguns passos que podem ajudar agora:
1. Guarde prints com nome de usuário, data e horário antes de bloquear.
2. Use as opções de silenciar, bloquear e denunciar da plataforma.
3. Converse com um adulto de confiança — pode ser alguém da família ou da escola.

Se em algum momento você se sentir em perigo, ligue 188 (CVV) ou 192 (SAMU). Estou por aqui para pensar com você no próximo passo.`,
  };
}
