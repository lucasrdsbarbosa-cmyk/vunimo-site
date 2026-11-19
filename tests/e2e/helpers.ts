import { expect, type Page, type TestInfo } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

// Mesma senha das contas fictícias de scripts/seed.mts.
export const TEST_PASSWORD = "Vunimo@teste1";

export function uniqueEmail(prefix: string, info: TestInfo): string {
  return `${prefix}-${info.project.name}-${Date.now()}@e2e.vunimo.test`;
}

export function isMobile(info: TestInfo): boolean {
  return info.project.name === "celular";
}

export async function login(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).not.toHaveURL(/\/entrar/);
}

export async function logout(page: Page) {
  // Página de conta tem o botão "Sair da conta" em qualquer formato de tela.
  await page.context().clearCookies();
}

/** Leitura direta do banco, só para preparar cenários de teste de permissão. */
export function testDb(): DatabaseSync {
  const db = new DatabaseSync(process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "vunimo.db"));
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

/** Remove os pedidos de um jovem fictício (o limite é 3 em andamento; vários testes usam a mesma conta). */
export function clearRequests(email: string) {
  const db = testDb();
  db.prepare("DELETE FROM support_requests WHERE youth_id = (SELECT id FROM users WHERE email = ?)").run(email);
  db.close();
}
