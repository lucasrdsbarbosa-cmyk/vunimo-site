/**
 * Conversa com IA — caminho completo com a API da Anthropic SIMULADA (tests/e2e/mock-anthropic.mjs).
 * Estes testes provam o que o SITE faz: o que envia (modelo, instruções, histórico só da conversa atual),
 * como mostra a resposta, os erros e o "Tentar de novo". Não provam a resposta do Claude de verdade —
 * isso é feito em tests/e2e/ia-real.spec.ts, com a chave real.
 */
import { expect, test, type Page } from "@playwright/test";
import { login, testDb } from "./helpers";

const LU = "jovem@vunimo.test";
const MOCK = "http://127.0.0.1:4010";

type Logged = { model: string; stream: boolean; hasKey: boolean; systemMentionsVunimo: boolean; messages: { role: string; text: string }[] };
const mockLog = async (page: Page): Promise<Logged[]> => (await page.request.get(`${MOCK}/__log`)).json();

function dbMessages(): { conversation_id: string; role: string; content: string }[] {
  const db = testDb();
  const rows = db
    .prepare(
      `SELECT m.conversation_id, m.role, m.content FROM ai_messages m JOIN ai_conversations c ON c.id = m.conversation_id
       WHERE c.user_id = (SELECT id FROM users WHERE email = ?) ORDER BY m.created_at, m.rowid`,
    )
    .all(LU) as { conversation_id: string; role: string; content: string }[];
  db.close();
  return rows;
}

async function sendMsg(page: Page, text: string) {
  await page.getByLabel("Sua mensagem").fill(text);
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
}

test.describe("Conversa com IA (API simulada)", () => {
  test.beforeEach(async ({ page }) => {
    const db = testDb();
    db.prepare("DELETE FROM ai_conversations WHERE user_id = (SELECT id FROM users WHERE email = ?)").run(LU);
    db.close();
    await page.request.post(`${MOCK}/__reset`);
    await login(page, LU);
    await page.goto("/app/conversa?nova=1");
  });

  test("oi, outro assunto e continuação: cada mensagem vai ao servidor com o histórico da conversa", async ({ page }) => {
    const log = page.getByRole("log");
    await sendMsg(page, "oi");
    await expect(log.getByText('[simulação] Você disse: "oi". Esta conversa tem 1 mensagem(ns).')).toBeVisible();
    await expect(page).toHaveURL(/\/app\/conversa\?c=/);

    await sendMsg(page, "Qual a capital do Brasil?");
    await expect(log.getByText('Você disse: "Qual a capital do Brasil?". Esta conversa tem 3 mensagem(ns). Mensagem anterior sua: "oi".', { exact: false })).toBeVisible();

    await sendMsg(page, "e a do Chile?");
    await expect(log.getByText("Esta conversa tem 5 mensagem(ns)", { exact: false })).toBeVisible();

    const calls = await mockLog(page);
    expect(calls).toHaveLength(3);
    for (const c of calls) {
      expect(c.stream).toBe(true);
      expect(c.hasKey).toBe(true); // a chave sai só do servidor
      expect(c.model).toBe("claude-opus-5-5");
      expect(c.systemMentionsVunimo).toBe(true);
    }
    // A continuação levou o histórico inteiro, na ordem certa
    expect(calls[2].messages.map((m) => `${m.role}:${m.text.slice(0, 12)}`)).toEqual([
      "user:oi",
      "assistant:[simulação] ",
      "user:Qual a capit",
      "assistant:[simulação] ",
      "user:e a do Chile",
    ]);
    // Nada de chave no navegador
    expect(await page.content()).not.toContain("chave-falsa-so-para-simulacao");

    // Salvo no banco: 3 perguntas e 3 respostas, sem duplicar
    await expect.poll(() => dbMessages().map((r) => r.role).join(",")).toBe("user,assistant,user,assistant,user,assistant");
  });

  test("conversas diferentes ficam separadas", async ({ page }) => {
    await sendMsg(page, "Meu jogo favorito é Minecraft");
    await expect(page.getByRole("log").getByText("Esta conversa tem 1 mensagem(ns)", { exact: false })).toBeVisible();
    const firstUrl = page.url();

    await page.getByRole("link", { name: "Nova conversa" }).click();
    await expect(page.getByRole("log").getByText("Comece quando quiser.")).toBeVisible();
    await sendMsg(page, "Que jogo eu disse?");
    await expect(page.getByRole("log").getByText("Esta conversa tem 1 mensagem(ns)", { exact: false })).toBeVisible();

    const calls = await mockLog(page);
    expect(calls[1].messages).toHaveLength(1); // a nova conversa não leva a anterior
    expect(JSON.stringify(calls[1].messages)).not.toContain("Minecraft");

    // A conversa anterior continua na lista e abre com o próprio histórico
    await page.goto("/app/conversa");
    await page.getByRole("link", { name: /Meu jogo favorito é Minecraft/ }).click();
    await expect(page).toHaveURL(firstUrl);
    await expect(page.getByRole("log").getByText("Você: Meu jogo favorito é Minecraft")).toBeVisible();
    await expect(page.getByRole("log").getByText("Que jogo eu disse?", { exact: false })).toHaveCount(0);
    expect(new Set(dbMessages().map((r) => r.conversation_id)).size).toBe(2);
  });

  test("erro da API aparece como erro (não como resposta da IA) e nada fica gravado", async ({ page }) => {
    await sendMsg(page, "teste #erro-401");
    await expect(page.locator("p[role=alert]")).toContainText("chave da Anthropic configurada no servidor é inválida");
    await expect(page.getByRole("log").getByText("Não enviada")).toBeVisible();
    await expect(page.getByRole("log").getByText("[simulação]", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tentar de novo" })).toHaveCount(0); // chave errada: tentar de novo não resolve
    expect(dbMessages()).toHaveLength(0);
  });

  test("falha temporária: mostra o erro, e Tentar de novo envia uma vez só", async ({ page }) => {
    await sendMsg(page, "oi de novo #falha-uma-vez");
    await expect(page.locator("p[role=alert]")).toContainText("instável ou sobrecarregada", { timeout: 20_000 });
    expect(dbMessages()).toHaveLength(0);

    await page.getByRole("button", { name: "Tentar de novo" }).click();
    const log = page.getByRole("log");
    await expect(log.getByText('[simulação] Você disse: "oi de novo #falha-uma-vez"', { exact: false })).toBeVisible();
    await expect(page.locator("p[role=alert]")).toHaveCount(0);
    await expect(log.getByText("Você: oi de novo #falha-uma-vez")).toHaveCount(1);
    await expect.poll(() => dbMessages().map((r) => r.role).join(",")).toBe("user,assistant");
  });

  test("estados de envio e clique duplo não duplicam mensagens", async ({ page }) => {
    await page.getByLabel("Sua mensagem").fill("mensagem única");
    const sendBtn = page.getByRole("button", { name: "Enviar mensagem" });
    await sendBtn.dblclick();
    await expect(page.getByRole("button", { name: "Enviando…" })).toBeDisabled();
    await expect(page.getByRole("log").getByText("A IA está escrevendo", { exact: false }).or(page.getByRole("log").locator(".vn-caret"))).toBeVisible();
    await expect(page.getByRole("log").getByText("[simulação]", { exact: false })).toBeVisible();
    await expect(page.getByRole("log").getByText("Você: mensagem única")).toHaveCount(1);
    expect((await mockLog(page)).length).toBe(1);
    await expect.poll(() => dbMessages().length).toBe(2);
  });
});
