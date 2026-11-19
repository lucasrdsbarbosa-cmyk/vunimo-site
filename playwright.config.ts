import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta das três jornadas e das permissões,
 * no computador (1280×800) e no celular (390×844, toque).
 * Rode `npm run seed` antes (o globalSetup também faz isso).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    // Servidor só dos testes (porta 3300), com a IA apontando para a SIMULAÇÃO da Anthropic
    // (tests/e2e/mock-anthropic.mjs). Para testar contra a API real, veja tests/e2e/ia-real.spec.ts.
    baseURL: process.env.BASE_URL ?? "http://localhost:3300",
    locale: "pt-BR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "computador",
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "celular",
      use: {
        ...devices["Pixel 7"],
        channel: "chrome",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : [
        {
          command: "node tests/e2e/mock-anthropic.mjs",
          url: "http://127.0.0.1:4010/__log",
          reuseExistingServer: true,
          timeout: 30_000,
        },
        {
          command: "npx next dev -p 3300",
          url: "http://localhost:3300",
          reuseExistingServer: true,
          timeout: 180_000,
          env: {
            NEXT_DIST_DIR: ".next-e2e",
            ANTHROPIC_API_KEY: "chave-falsa-so-para-simulacao",
            AI_BASE_URL: "http://127.0.0.1:4010",
            AI_MODEL: "claude-opus-5-5",
          },
        },
      ],
});
