/**
 * Conversa com IA — teste com a API REAL da Anthropic (gasta alguns centavos de crédito).
 * Só roda quando você pede, contra um site que tenha ANTHROPIC_API_KEY configurada:
 *
 *   $env:IA_REAL = "1"; $env:BASE_URL = "http://localhost:3000"; npx playwright test ia-real --project=computador
 *
 * A chave nunca aparece aqui: o teste só usa o chat do site, como uma pessoa usaria.
 */
import { expect, test, type Page } from "@playwright/test";
import { login, testDb } from "./helpers";

const LU = "jovem@vunimo.test";
test.skip(!process.env.IA_REAL, "Teste com a API real: defina IA_REAL=1 e BASE_URL (veja o topo do arquivo).");
test.setTimeout(180_000);

async function ask(page: Page, text: string): Promise<string> {
  const log = page.getByRole("log");
  const before = await log.locator("li").count();
  await page.getByLabel("Sua mensagem").fill(text);
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.getByRole("button", { name: "Enviar mensagem" })).toBeEnabled({ timeout: 90_000 });
  await expect(page.locator("p[role=alert]")).toHaveCount(0);
  await expect(log.locator("li")).toHaveCount(before + 2);
  const reply = (await log.locator("li").last().innerText()).replace(/^IA:\s*/, "").replace(/\s*Ouvir$/, "").trim();
  console.log(`\n> ${text}\n< ${reply}\n`);
  return reply;
}

test("Claude real: saudação, assuntos diferentes, continuação e conversas separadas", async ({ page }) => {
  const db = testDb();
  db.prepare("DELETE FROM ai_conversations WHERE user_id = (SELECT id FROM users WHERE email = ?)").run(LU);
  db.close();
  await login(page, LU);
  await page.goto("/app/conversa?nova=1");
  await expect(page.getByText("ainda não está ligada")).toHaveCount(0);

  const hi = await ask(page, "oi");
  expect(hi.length).toBeGreaterThan(0);
  expect(hi.split(/\s+/).length).toBeLessThan(60); // saudação curta, não um texto pronto longo
  expect(hi).not.toContain("[simulação]");

  const math = await ask(page, "Quanto é 17 vezes 3?");
  expect(math).toMatch(/51/);

  const game = await ask(page, "Meu jogo favorito é Minecraft. Me diga em uma frase por que ele é popular.");
  expect(game.toLowerCase()).toContain("minecraft");

  const follow = await ask(page, "Qual jogo eu disse que era meu favorito? Responda só o nome.");
  expect(follow.toLowerCase()).toContain("minecraft");

  const fix = await ask(page, "Corrigindo: na verdade é Roblox. Qual é o meu favorito agora? Só o nome.");
  expect(fix.toLowerCase()).toContain("roblox");

  // Conversa nova não sabe da anterior
  await page.getByRole("link", { name: "Nova conversa" }).click();
  const fresh = await ask(page, "Qual é o meu jogo favorito? Se você não souber, diga que não sabe.");
  expect(fresh.toLowerCase()).not.toContain("roblox");
});
