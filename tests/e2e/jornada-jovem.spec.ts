import { expect, test } from "@playwright/test";
import { isMobile, login, testDb, TEST_PASSWORD, uniqueEmail } from "./helpers";

test.describe("Jornada 1 — jovem que acabou de passar por algo ruim (sem conta)", () => {
  test("encontra onde começar, faz a pausa, lê a orientação e chega ao apoio", async ({ page }, info) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aconteceu algo ruim");
    // Ajuda urgente visível logo de cara
    await expect(page.getByRole("link", { name: "CVV 188" })).toBeVisible();

    await page.getByRole("link", { name: "Começar agora" }).click();
    await expect(page).toHaveURL(/\/comecar$/);
    await expect(page.getByRole("heading", { name: "Como você quer começar?" })).toBeVisible();

    // Pausa guiada
    await page.getByRole("link", { name: /Pausa\s+Um momento para respirar/ }).click();
    await expect(page).toHaveURL(/\/pausa$/);
    await page.getByRole("button", { name: "Começar" }).click();
    await expect(page.getByText(/Inspire|Segure|Solte devagar/)).toBeVisible();
    await page.getByRole("button", { name: "Parar" }).click();
    await expect(page.getByText("Pronto.")).toBeVisible();

    // Navega pela barra principal (inferior no celular, lateral no computador)
    const nav = page.getByRole("navigation", { name: "Navegação principal" });
    await nav.getByRole("link", { name: "Orientação" }).click();
    await expect(page).toHaveURL(/\/orientar$/);
    await page.getByRole("link", { name: /Bloquear/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bloquear quem está te atacando");
    await expect(page.getByRole("listitem").filter({ hasText: "Guarde o que precisa antes" })).toBeVisible();

    await page.getByRole("link", { name: "Ver caminhos de apoio" }).click();
    await expect(page).toHaveURL(/\/conectar$/);
    await expect(page.getByRole("heading", { name: "Ana Ribeiro (fictícia)" })).toBeVisible();
    // Profissional em análise não aparece no diretório
    await expect(page.getByText("Carlos Mendes (fictício)")).toHaveCount(0);

    // Pedir apoio sem conta leva ao cadastro, guardando o destino
    await page.getByRole("link", { name: "Pedir apoio a Ana" }).click();
    await expect(page).toHaveURL(/\/cadastro\?next=/);

    if (isMobile(info)) {
      await expect(nav).toBeHidden(); // páginas institucionais usam o menu do topo
    }
  });

  test("desabafar sem conta explica por que pede cadastro", async ({ page }) => {
    await page.goto("/desabafar");
    await expect(page.getByText("Não é atendimento profissional", { exact: false })).toBeVisible();
    await page.getByRole("link", { name: "Escrever no diário" }).click();
    await expect(page).toHaveURL(/\/cadastro\?next=%2Fapp%2Fdiario/);
  });
});

test.describe("Cadastro do jovem e retorno à conta", () => {
  test("mostra erros claros, cria a conta e continua de onde parou", async ({ page }, info) => {
    const email = uniqueEmail("jovem", info);

    await page.goto("/cadastro");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Escolha um apelido com pelo menos 2 letras.")).toBeVisible();
    await expect(page.getByText("Digite um e-mail válido", { exact: false })).toBeVisible();
    await expect(page.getByText("A senha precisa ter pelo menos 8 caracteres.")).toBeVisible();

    // Menor de 13 anos recebe orientação, não um erro seco
    await page.getByLabel("Como quer ser chamado(a)?").fill("Testa");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByLabel("Ano em que você nasceu").fill(String(new Date().getFullYear() - 10));
    await page.getByLabel(/Li como meus dados/).check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("A Vunimo é para quem tem 13 anos ou mais", { exact: false })).toBeVisible();
    // O apelido digitado continua no formulário
    await expect(page.getByLabel("Como quer ser chamado(a)?")).toHaveValue("Testa");

    await page.getByLabel("Ano em que você nasceu").fill("2010");
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByLabel(/Li como meus dados/).check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/app\?boas-vindas=1/);
    await expect(page.getByText("Conta criada.", { exact: false })).toBeVisible();

    // Diário: erro ao salvar vazio, depois salva
    await page.getByRole("link", { name: /Meu diário/ }).first().click();
    await page.getByRole("button", { name: "Salvar no diário" }).click();
    await expect(page.getByText("Escreva alguma coisa antes de salvar.")).toBeVisible();
    await page.getByLabel("Título").fill("Primeiro registro");
    await page.getByLabel("Seu texto").fill("Hoje foi difícil, mas escrever ajuda.");
    await page.getByRole("button", { name: "Salvar no diário" }).click();
    await expect(page.getByText("Registro salvo.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Primeiro registro/ })).toBeVisible();

    // Conversa com IA (modo demonstração sem chave) + sinal de risco
    await page.goto("/app/conversa");
    await expect(page.getByText("Não é atendimento profissional.")).toBeVisible();
    await page.getByLabel("Sua mensagem").fill("Me xingaram no jogo hoje.");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByRole("log").getByText("Me xingaram no jogo hoje.")).toBeVisible();
    await expect(page.getByRole("log").getByText("Obrigado por contar.", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Sua mensagem")).toBeEnabled();
    await page.getByLabel("Sua mensagem").fill("às vezes não quero mais viver");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByRole("heading", { name: "Se você corre risco agora, não espere" })).toBeVisible();

    // Visita a Orientação, sai e volta: o painel oferece continuar
    await page.goto("/orientar/denunciar");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Denunciar");
    await page.waitForTimeout(500); // registro de progresso é assíncrono
    await page.context().clearCookies();

    await login(page, email);
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText("Continuar de onde parou")).toBeVisible();
    await expect(page.getByText("Orientação: Denunciar")).toBeVisible();
    await page.getByRole("link", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/orientar\/denunciar$/);
  });

  test("login com senha errada mostra mensagem e mantém o e-mail", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill("jovem@vunimo.test");
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha não conferem.", { exact: false })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toHaveValue("jovem@vunimo.test");
  });
});

test.describe("Jornada 2 — usuário com conta volta para continuar", () => {
  test("entra e retoma o último ponto salvo", async ({ page }, info) => {
    // Estado conhecido: a última visita salva da Lu é Orientação > Bloquear.
    const db = testDb();
    db.prepare(
      "UPDATE progress SET last_path = '/orientar/bloquear', last_label = 'Orientação: Bloquear' WHERE user_id = (SELECT id FROM users WHERE email = 'jovem@vunimo.test')",
    ).run();
    db.close();

    await page.goto("/");
    if (isMobile(info)) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator("#menu-celular").getByRole("link", { name: "Entrar" }).click();
    } else {
      await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Entrar" }).click();
    }
    await expect(page).toHaveURL(/\/entrar$/);
    await page.getByLabel("E-mail").fill("jovem@vunimo.test");
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { name: "Como você quer seguir hoje?" })).toBeVisible();
    await expect(page.getByText("Orientação: Bloquear")).toBeVisible();
    await expect(page.getByText(/Último registro: Depois da partida/)).toBeVisible();
    await page.getByRole("link", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/orientar\/bloquear$/);

    // Abre o diário pela navegação e vê o registro anterior
    await page.goto("/app/diario");
    await page.getByRole("link", { name: /Depois da partida/ }).click();
    await expect(page.getByLabel("Seu texto")).toHaveValue(/me xingar no chat de voz/);
  });

  test("área privada sem login leva ao login e volta para onde ia", async ({ page }) => {
    await page.goto("/app/diario");
    await expect(page).toHaveURL(/\/entrar\?next=%2Fapp%2Fdiario/);
    await page.getByLabel("E-mail").fill("jovem@vunimo.test");
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/app\/diario$/);
  });
});
