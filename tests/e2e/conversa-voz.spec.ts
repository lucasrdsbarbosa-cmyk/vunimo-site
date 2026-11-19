import { expect, test, type Page } from "@playwright/test";
import { login, testDb } from "./helpers";

const LU = "jovem@vunimo.test";

function clearChat() {
  const db = testDb();
  db.prepare("DELETE FROM ai_conversations WHERE user_id = (SELECT id FROM users WHERE email = ?)").run(LU);
  db.close();
}

/** Substitui a voz do navegador por versões de teste (o robô de teste não tem microfone nem alto-falante). */
async function fakeVoice(page: Page, opts: { heard?: string; error?: string } = {}) {
  await page.addInitScript(({ heard, error }) => {
    const w = window as unknown as Record<string, unknown>;
    w.__spoken = [] as string[];
    const synth = window.speechSynthesis;
    synth.speak = (u: SpeechSynthesisUtterance) => {
      (w.__spoken as string[]).push(u.text);
      setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 300);
    };
    synth.cancel = () => {};
    class FakeRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        w.__recLang = this.lang;
        setTimeout(() => {
          if (error) this.onerror?.({ error });
          else {
            this.onresult?.({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: "oi" } }] });
            this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: heard ?? "oi" } }] });
          }
          this.onend?.();
        }, 250);
      }
      stop() {}
      abort() {}
    }
    w.SpeechRecognition = FakeRecognition;
    w.webkitSpeechRecognition = FakeRecognition;
  }, opts);
}

test.describe("Conversa com IA em tempo real", () => {
  test.beforeEach(() => clearChat());

  test("responde a qualquer mensagem, com a resposta aparecendo enquanto é escrita", async ({ page }) => {
    await fakeVoice(page);
    await login(page, LU);
    await page.goto("/app/conversa");
    await page.getByLabel("Sua mensagem").fill("oi");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    const log = page.getByRole("log");
    await expect(log.getByText("Você: oi", { exact: true })).toBeVisible();
    await expect(log.locator(".vn-caret")).toBeVisible(); // ainda escrevendo
    await expect(log.getByText("Obrigado por contar", { exact: false })).toBeVisible();
    await expect(log.locator(".vn-caret")).toHaveCount(0);

    // Ouvir a resposta
    await log.getByRole("button", { name: "Ouvir" }).click();
    await expect(log.getByRole("button", { name: "Parar" })).toBeVisible();
    const spoken = await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
    expect(spoken[0]).toContain("Obrigado por contar");

    // A conversa fica salva
    await page.reload();
    await expect(page.getByRole("log").getByText("Obrigado por contar", { exact: false })).toBeVisible();
  });

  test("falar em vez de escrever: o texto entra na caixa; no modo voz, envia e lê a resposta", async ({ page }) => {
    await fakeVoice(page, { heard: "me xingaram no jogo" });
    await login(page, LU);
    await page.goto("/app/conversa");
    await page.getByRole("button", { name: "Falar em vez de escrever" }).click();
    await expect(page.getByLabel("Sua mensagem")).toHaveValue("me xingaram no jogo");
    expect(await page.evaluate(() => (window as unknown as { __recLang: string }).__recLang)).toBe("pt-BR");

    await page.getByLabel("Sua mensagem").fill("");
    await page.getByRole("checkbox", { name: /Modo voz/ }).check();
    await page.getByRole("button", { name: "Falar em vez de escrever" }).click();
    const log = page.getByRole("log");
    await expect(log.getByText("Você: me xingaram no jogo", { exact: true })).toBeVisible();
    await expect(log.getByText("Obrigado por contar", { exact: false })).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.length)).toBeGreaterThan(0);
    await page.getByRole("checkbox", { name: /Modo voz/ }).uncheck();
  });

  test("navegador sem ditado (como o Brave) explica o que fazer", async ({ page }) => {
    await fakeVoice(page, { error: "network" });
    await login(page, LU);
    await page.goto("/app/conversa");
    await page.getByRole("button", { name: "Falar em vez de escrever" }).click();
    await expect(page.getByText("O ditado por voz não está disponível neste navegador", { exact: false })).toBeVisible();
  });

  test("diário: conversar com a IA sobre um registro traz o texto para revisar", async ({ page }) => {
    await login(page, LU);
    await page.goto("/app/diario");
    await page.getByRole("link", { name: /Depois da partida/ }).click();
    await page.getByRole("link", { name: "Conversar com a IA sobre isto" }).click();
    await expect(page).toHaveURL(/\/app\/conversa\?diario=/);
    await expect(page.getByLabel("Sua mensagem")).toHaveValue(/Depois da partida[\s\S]*chat de voz/);
    await expect(page.getByText("Revise ou apague o que não quiser compartilhar", { exact: false })).toBeVisible();
  });

  test("a rota da conversa recusa outra origem e quem não está logado", async ({ request, baseURL }) => {
    const other = await request.post("/api/conversa", { data: { message: "oi" }, headers: { origin: "https://exemplo.com" } });
    expect(other.status()).toBe(403);
    const anon = await request.post("/api/conversa", { data: { message: "oi" }, headers: { origin: baseURL! } });
    expect(anon.status()).toBe(401);
  });
});
