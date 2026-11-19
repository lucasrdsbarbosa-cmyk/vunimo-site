import { expect, test } from "@playwright/test";
import { clearRequests, login, testDb, TEST_PASSWORD, uniqueEmail } from "./helpers";

test.describe("Jornada 3 — profissional de saúde", () => {
  test("entende como participar, se cadastra, é aprovado e responde um pedido", async ({ page }, info) => {
    const email = uniqueEmail("pro", info);
    const name = `Beatriz Teste ${info.project.name}`;

    await page.goto("/profissionais");
    await expect(page.getByRole("heading", { name: "Como participar" })).toBeVisible();
    await page.getByRole("link", { name: "Quero me cadastrar" }).click();
    await expect(page).toHaveURL(/\/profissionais\/cadastro$/);

    // Envio vazio: resumo + erros por campo
    await page.getByRole("button", { name: "Enviar cadastro para análise" }).click();
    await expect(page.getByText("Alguns campos precisam de ajuste.", { exact: false })).toBeVisible();
    await expect(page.getByText("Informe o número do registro no conselho", { exact: false })).toBeVisible();

    await page.getByLabel("E-mail profissional").fill(email);
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByLabel("Nome completo").fill(name);
    await page.getByLabel("Área de atuação").selectOption("Psicologia");
    await page.getByLabel("Como você pode atender").selectOption("online");
    await page.getByLabel("Registro no conselho").fill("CRP 00/999999");
    await page.getByLabel("Estado do registro").selectOption("RJ");
    await page.getByLabel("Áreas de experiência").fill("Adolescência e violência online");
    await page.getByLabel("Apresentação para os jovens").fill(
      "Atendo adolescentes há alguns anos e posso ajudar a pensar nos próximos passos com calma.",
    );
    await page.getByLabel(/Li as diretrizes/).check();
    await page.getByRole("button", { name: "Enviar cadastro para análise" }).click();

    await expect(page).toHaveURL(/\/pro\?cadastro=1/);
    await expect(page.getByText("Em análise")).toBeVisible();
    // Sem aprovação, não acessa pedidos
    await page.goto("/pro/pedidos");
    await expect(page).toHaveURL(/\/pro\?aviso=aguardando-aprovacao/);
    // E não aparece no diretório
    await page.goto("/conectar");
    await expect(page.getByText(name)).toHaveCount(0);

    // Admin aprova
    await page.context().clearCookies();
    await login(page, "admin@vunimo.test");
    await expect(page).toHaveURL(/\/admin$/);
    const card = page.getByRole("listitem").filter({ hasText: name });
    await card.getByRole("button", { name: "Aprovar", exact: true }).click();
    await expect(page.getByText("Profissional aprovado e incluído no diretório.")).toBeVisible();

    // Jovem encontra no diretório e envia pedido
    clearRequests("jovem@vunimo.test");
    await page.context().clearCookies();
    await login(page, "jovem@vunimo.test");
    await page.goto("/conectar");
    await page.getByRole("listitem").filter({ hasText: name }).getByRole("link", { name: "Pedir apoio a Beatriz" }).click();
    await expect(page).toHaveURL(/\/app\/pedidos\?profissional=/);
    await expect(page.getByLabel("Para quem")).toHaveValue(/.+/);
    await page.getByRole("button", { name: "Enviar pedido" }).click();
    await expect(page.getByText("Escolha o assunto.")).toBeVisible();
    await page.getByLabel("Assunto").selectOption("Ameaças");
    await page.getByLabel("Sua mensagem").fill(`Uma pessoa disse no jogo que vai espalhar meu perfil (${info.project.name}). O que eu faço?`);
    await page.getByLabel(/Entendo que só esse profissional/).check();
    await page.getByRole("button", { name: "Enviar pedido" }).click();
    await expect(page.getByText("Pedido enviado.", { exact: false })).toBeVisible();
    await expect(page.getByText("Aguardando resposta").first()).toBeVisible();

    // Profissional responde
    await page.context().clearCookies();
    await login(page, email);
    await page.goto("/pro/pedidos");
    const request = page.getByRole("listitem").filter({ hasText: `meu perfil (${info.project.name})` });
    await request.getByLabel("Sua resposta").fill("Guarde as capturas de tela e conte para um adulto de confiança. Você pode bloquear e denunciar.");
    await request.getByRole("button", { name: "Enviar resposta" }).click();
    await expect(page.getByText("Resposta enviada.")).toBeVisible();

    // Jovem vê a resposta
    await page.context().clearCookies();
    await login(page, "jovem@vunimo.test");
    await page.goto("/app/pedidos");
    const mine = page.getByRole("listitem").filter({ hasText: `meu perfil (${info.project.name})` });
    await expect(mine.getByText(/Resposta de Beatriz/)).toBeVisible();
    await expect(mine.getByText("Guarde as capturas de tela", { exact: false })).toBeVisible();
  });
});

test.describe("Permissões aplicadas no servidor", () => {
  test("visitante não entra em áreas privadas", async ({ page }) => {
    for (const path of ["/app", "/app/conversa", "/pro", "/pro/pedidos", "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/entrar\?next=/);
    }
  });

  test("jovem não acessa área de profissional nem administração", async ({ page }) => {
    await login(page, "jovem@vunimo.test");
    await page.goto("/pro");
    await expect(page).toHaveURL(/\/app\?aviso=sem-permissao/);
    await expect(page.getByText("Essa área não está disponível para a sua conta.")).toBeVisible();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/app\?aviso=sem-permissao/);
  });

  test("jovem não lê o diário de outro jovem mesmo sabendo o id", async ({ page }) => {
    const db = testDb();
    const row = db
      .prepare(
        "SELECT j.id FROM journal_entries j JOIN users u ON u.id = j.user_id WHERE u.email = 'jovem2@vunimo.test' LIMIT 1",
      )
      .get() as { id: string };
    db.close();
    await login(page, "jovem@vunimo.test");
    await page.goto(`/app/diario?registro=${row.id}`);
    await expect(page.getByText("Não encontramos esse registro.", { exact: false })).toBeVisible();
    await expect(page.getByText("Este texto só pode ser lido pelo Teo.")).toHaveCount(0);
  });

  test("profissional não acessa diário, conversa nem pedidos de outros", async ({ page }) => {
    await login(page, "psicologa@vunimo.test");
    await page.goto("/app/diario");
    await expect(page).toHaveURL(/\/pro\?aviso=sem-permissao/);
    await page.goto("/app/conversa");
    await expect(page).toHaveURL(/\/pro\?aviso=sem-permissao/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/pro\?aviso=sem-permissao/);
    // Vê só os pedidos endereçados a ela, sem e-mail do jovem
    await page.goto("/pro/pedidos");
    await expect(page.getByText("Me tiraram do grupo da turma", { exact: false })).toBeVisible();
    await expect(page.getByText("jovem2@vunimo.test")).toHaveCount(0);
  });

  test("profissional em análise não recebe pedidos", async ({ page }) => {
    await login(page, "medico@vunimo.test");
    await page.goto("/pro/pedidos");
    await expect(page).toHaveURL(/\/pro\?aviso=aguardando-aprovacao/);
  });

  test("o banco recusa pedido para profissional não aprovado e troca de dono", () => {
    const db = testDb();
    const ids = Object.fromEntries(
      (db.prepare("SELECT email, id FROM users WHERE email IN ('jovem@vunimo.test','medico@vunimo.test','jovem2@vunimo.test')").all() as {
        email: string;
        id: string;
      }[]).map((r) => [r.email, r.id]),
    );
    expect(() =>
      db
        .prepare(
          "INSERT INTO support_requests (id, youth_id, professional_id, topic, message, created_at, updated_at) VALUES (?, ?, ?, 't', 'm', 0, 0)",
        )
        .run(crypto.randomUUID(), ids["jovem@vunimo.test"], ids["medico@vunimo.test"]),
    ).toThrow(/request_rules/);
    expect(() =>
      db.prepare("UPDATE journal_entries SET user_id = ? WHERE user_id = ?").run(ids["jovem@vunimo.test"], ids["jovem2@vunimo.test"]),
    ).toThrow(/journal_owner_fixed/);
    db.close();
  });
});
