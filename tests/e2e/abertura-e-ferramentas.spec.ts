import { expect, test, type Page } from "@playwright/test";
import { clearRequests, isMobile, login, testDb } from "./helpers";

/** Rola até uma fração da cena (0 = início, 1 = fim do trecho fixo) e espera o scrub assentar. */
async function scrollScene(page: Page, fraction: number, mobile: boolean) {
  await page.evaluate(
    ([f, m]) => window.scrollTo(0, Math.round(window.innerHeight * (m ? 1.6 : 2.3) * (f as number))),
    [fraction, mobile] as const,
  );
  await page.waitForTimeout(1200);
}

test.describe("Abertura da página inicial", () => {
  test("botões disponíveis desde o início, cena encaixa e volta ao estado inicial", async ({ page }, info) => {
    const mobile = isMobile(info);
    await page.goto("/");
    // Criar conta / entrar sem esperar a abertura
    const hero = page.locator(".vn-hero");
    await expect(hero.getByRole("link", { name: "Criar conta" })).toBeVisible();
    await expect(hero.getByRole("link", { name: "Começar agora" })).toBeVisible();
    // Símbolo bem enquadrado: os dois traços dentro da tela no início
    for (const sel of [".vn-stroke-a", ".vn-stroke-b"]) {
      const box = await page.locator(sel).boundingBox();
      const vw = page.viewportSize()!;
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(vw.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(vw.height);
    }

    // Meio da cena: título do pôster saiu, frase intermediária entrou
    await scrollScene(page, 0.35, mobile);
    await expect(page.locator(".vn-mid-1")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeHidden();

    // Fim: os quatro caminhos aparecem e são clicáveis; o logo do topo "acendeu"
    await scrollScene(page, 1, mobile);
    const tiles = page.locator(".vn-tile-link");
    await expect(tiles).toHaveCount(4);
    for (let i = 0; i < 4; i++) await expect(tiles.nth(i)).toBeVisible();
    await expect(page.locator("[data-header-logo]")).toBeVisible();
    // Traços viraram cantos da moldura: A acima/à esquerda e B abaixo/à direita do primeiro e último cartões
    const a = (await page.locator(".vn-stroke-a").boundingBox())!;
    const b = (await page.locator(".vn-stroke-b").boundingBox())!;
    const frame = (await page.locator(".vn-frame").boundingBox())!;
    expect(a.x).toBeLessThan(frame.x + 10);
    expect(a.y).toBeLessThan(frame.y + 10);
    expect(b.x + b.width).toBeGreaterThan(frame.x + frame.width - 10);
    expect(b.y + b.height).toBeGreaterThan(frame.y + frame.height - 10);

    // Voltando ao topo, o pôster e o título retornam
    await scrollScene(page, 0, mobile);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(hero.getByRole("link", { name: "Criar conta" })).toBeVisible();

    await tiles.first().scrollIntoViewIfNeeded().catch(() => {});
  });

  test.describe("movimento reduzido", () => {
    test.use({ reducedMotion: "reduce" });
    test("mostra o mesmo conteúdo sem fixar a tela", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".vn-stroke-a")).toBeHidden();
      await expect(page.locator(".vn-static-symbol")).toBeVisible();
      await expect(page.locator("[data-header-logo]")).toBeVisible();
      await page.getByRole("heading", { name: /Quatro caminhos/ }).scrollIntoViewIfNeeded();
      await expect(page.locator(".vn-tile-link")).toHaveCount(4);
      await expect(page.locator(".vn-tile-link").first()).toBeVisible();
      await expect(page.locator(".vn-bracket-a")).toBeVisible();
      // Sem espaço extra de cena fixa: a página é curta
      const h = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
      expect(h).toBeLessThan(8);
    });

    test("a pessoa pode escolher ver a abertura animada mesmo assim, e voltar", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Ver abertura animada" }).click();
      await expect(page.locator(".vn-stroke-a")).toBeVisible();
      await expect(page.locator(".vn-hero[data-motion]")).toHaveCount(1);
      await page.reload();
      await expect(page.locator(".vn-stroke-a")).toBeVisible(); // escolha lembrada
      await page.getByRole("button", { name: "Reduzir movimento" }).click();
      await expect(page.locator(".vn-static-symbol")).toBeVisible();
      await expect(page.locator(".vn-stroke-a")).toBeHidden();
    });
  });
});

test.describe("Ferramentas do jovem", () => {
  test("painel mostra por onde começar e as ferramentas", async ({ page }) => {
    const db = testDb();
    for (const t of ["timeline_events", "action_plans"]) {
      db.prepare(`DELETE FROM ${t} WHERE user_id = (SELECT id FROM users WHERE email = 'jovem2@vunimo.test')`).run();
    }
    db.close();
    await login(page, "jovem2@vunimo.test");
    await expect(page.getByRole("heading", { name: "Por onde começar" })).toBeVisible();
    for (const name of ["Linha do tempo", "Plano de próximos passos", "Rascunho de denúncia", "Meu diário", "Conversa com IA", "Pedidos de apoio"]) {
      await expect(page.getByRole("main").getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
    }
  });

  test("linha do tempo valida, salva e edita", async ({ page }, info) => {
    await login(page, "jovem2@vunimo.test");
    await page.goto("/app/linha-do-tempo");
    await page.getByLabel("O que aconteceu").fill("");
    await page.getByRole("button", { name: "Adicionar à linha do tempo" }).click();
    await expect(page.getByText("Escolha onde aconteceu.")).toBeVisible();
    await expect(page.getByText("Conte em poucas palavras o que aconteceu.")).toBeVisible();

    const text = `Comentários ofensivos na minha foto (${info.project.name})`;
    await page.getByLabel("Onde", { exact: true }).selectOption("Instagram");
    await page.getByLabel("Tipo").selectOption("Ofensas ou xingamentos");
    await page.getByLabel("O que aconteceu").fill(text);
    await page.getByText("Sim", { exact: true }).click();
    await page.getByRole("button", { name: "Adicionar à linha do tempo" }).click();
    await expect(page.getByText("Registro adicionado à linha do tempo.")).toBeVisible();
    const item = page.getByRole("listitem").filter({ hasText: text });
    await expect(item.getByText(/Print guardado/)).toBeVisible();

    await item.getByRole("link", { name: "Editar" }).click();
    await expect(page.getByRole("heading", { name: "Editar registro" })).toBeVisible();
    await expect(page.getByLabel("O que aconteceu")).toHaveValue(text);
    await page.getByLabel("O que aconteceu").fill(`${text} — editado`);
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Registro atualizado.")).toBeVisible();
    await expect(page.getByText(`${text} — editado`)).toBeVisible();
  });

  test("plano: perguntas viram checklist que fica salvo", async ({ page }) => {
    await login(page, "jovem2@vunimo.test");
    const db = testDb();
    db.prepare("DELETE FROM action_plans WHERE user_id = (SELECT id FROM users WHERE email = 'jovem2@vunimo.test')").run();
    db.close();
    await page.goto("/app/plano");
    await page.getByRole("button", { name: "Montar meu plano" }).click();
    await expect(page.getByText("Marque pelo menos uma opção.")).toBeVisible();

    await page.getByText("Num jogo online").click();
    await page.getByText("Ameaças").click();
    await page.getByRole("group", { name: "Ainda está acontecendo?" }).getByText("Sim").click();
    await page.getByRole("group", { name: "Algum adulto de confiança já sabe?" }).getByText("Ainda não").click();
    await page.getByRole("group", { name: /Você se sente em perigo/ }).getByText("Não").click();
    await page.getByRole("button", { name: "Montar meu plano" }).click();

    await expect(page.getByText("Seu plano está pronto.", { exact: false })).toBeVisible();
    await expect(page.getByText("Não responda nem negocie")).toBeVisible();
    await expect(page.getByText("Conte para um adulto de confiança")).toBeVisible();
    await page.getByRole("checkbox", { name: /Faça uma pausa antes de agir/ }).check();
    await expect(page.getByText(/1 de \d+ passos feitos/)).toBeVisible();
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.getByRole("checkbox", { name: /Faça uma pausa antes de agir/ })).toBeChecked();
  });

  test("rascunho de denúncia usa a linha do tempo, melhora com IA e salva", async ({ page }) => {
    await login(page, "jovem@vunimo.test");
    await page.goto("/app/denuncia");
    await page.getByRole("radio", { name: "Plataforma (rede social ou jogo)" }).check();
    await page.getByRole("button", { name: "Criar rascunho" }).click();
    await expect(page.getByText("Rascunho criado", { exact: false })).toBeVisible();
    const body = page.getByLabel("Texto");
    await expect(body).toHaveValue(/Roblox/);
    await expect(body).toHaveValue(/WhatsApp/);

    await page.getByRole("button", { name: /Melhorar com IA/ }).click();
    await expect(page.getByText(/Modo demonstração|A IA reorganizou/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Desfazer melhoria" })).toBeVisible();
    await body.fill(`${await body.inputValue()}\n\nAnexo os prints.`);
    await expect(page.getByText("Alterações não salvas")).toBeVisible();
    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText("Rascunho salvo.")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Texto")).toHaveValue(/Anexo os prints\./);
  });

  test("pedido com resumo anexado chega ao profissional, que pede rascunho à IA", async ({ page }, info) => {
    clearRequests("jovem@vunimo.test");
    await login(page, "jovem@vunimo.test");
    await page.goto("/app/pedidos");
    const msg = `Estão me excluindo dos grupos e rindo de mim no jogo (${info.project.name}).`;
    await page.getByLabel("Para quem").selectOption({ label: "Ana Ribeiro (fictícia) — Psicologia" });
    await page.getByLabel("Assunto").selectOption("Exclusão ou isolamento em grupos");
    await page.getByLabel("Sua mensagem").fill(msg);
    await page.getByLabel(/Anexar um resumo da minha linha do tempo/).check();
    await page.getByLabel(/Entendo que só esse profissional/).check();
    await page.getByRole("button", { name: "Enviar pedido" }).click();
    await expect(page.getByText("Pedido enviado.", { exact: false })).toBeVisible();

    await page.context().clearCookies();
    await login(page, "psicologa@vunimo.test");
    await page.goto("/pro/pedidos");
    const card = page.getByRole("listitem").filter({ hasText: msg });
    await expect(card.getByText("Resumo anexado pelo jovem")).toBeVisible();
    await expect(card.getByText(/Roblox/)).toBeVisible();
    // Nome de usuário de terceiros e local dos prints não vão no resumo
    await expect(card.getByText("jogador_fake123")).toHaveCount(0);
    await expect(card.getByText("Pasta Prints no celular")).toHaveCount(0);

    await card.getByRole("button", { name: /Sugerir rascunho/ }).click();
    await expect(card.getByText(/Modo demonstração|Rascunho sugerido pela IA/)).toBeVisible();
    await expect(card.getByLabel("Sua resposta")).not.toHaveValue("");
  });

  test("profissional pode pausar novos pedidos e some do diretório", async ({ page }) => {
    await login(page, "psicologa@vunimo.test");
    await page.goto("/pro");
    await page.getByRole("button", { name: "Pausar novos pedidos" }).click();
    await expect(page.getByText("Novos pedidos pausados.", { exact: true })).toBeVisible();
    await page.goto("/conectar");
    await expect(page.getByText("Ana Ribeiro (fictícia)")).toHaveCount(0);
    await page.goto("/pro");
    await page.getByRole("button", { name: "Voltar a receber pedidos" }).click();
    await expect(page.getByText("Você voltou a aparecer no diretório.")).toBeVisible();
  });
});

test.describe("Permissões das ferramentas", () => {
  test("um jovem não abre o rascunho de outro, e profissional não acessa as ferramentas", async ({ page }) => {
    const db = testDb();
    const owner = db.prepare("SELECT id FROM users WHERE email = 'jovem@vunimo.test'").get() as { id: string };
    const draftId = crypto.randomUUID();
    db.prepare(
      "INSERT INTO report_drafts (id, user_id, recipient, title, body, created_at, updated_at) VALUES (?, ?, 'escola', 'Rascunho secreto da Lu', 'Texto privado da Lu para a escola.', 0, 0)",
    ).run(draftId, owner.id);
    db.close();

    await login(page, "jovem2@vunimo.test");
    await page.goto(`/app/denuncia?rascunho=${draftId}`);
    await expect(page.getByText("Não encontramos esse rascunho.")).toBeVisible();
    await expect(page.getByText("Texto privado da Lu para a escola.")).toHaveCount(0);

    await page.context().clearCookies();
    await login(page, "psicologa@vunimo.test");
    for (const p of ["/app/linha-do-tempo", "/app/plano", "/app/denuncia"]) {
      await page.goto(p);
      await expect(page).toHaveURL(/\/pro\?aviso=sem-permissao/);
    }
  });

  test("o banco recusa ferramentas para contas que não são de jovem", () => {
    const db = testDb();
    const pro = db.prepare("SELECT id FROM users WHERE email = 'psicologa@vunimo.test'").get() as { id: string };
    expect(() =>
      db
        .prepare(
          "INSERT INTO timeline_events (id, user_id, happened_on, platform, kind, description, created_at, updated_at) VALUES (?, ?, '2026-01-01', 'x', 'y', 'z', 0, 0)",
        )
        .run(crypto.randomUUID(), pro.id),
    ).toThrow(/timeline_only_youth/);
    expect(() =>
      db
        .prepare("INSERT INTO report_drafts (id, user_id, recipient, title, body, created_at, updated_at) VALUES (?, ?, 'escola', 't', 'b', 0, 0)")
        .run(crypto.randomUUID(), pro.id),
    ).toThrow(/drafts_only_youth/);
    db.close();
  });

  test("ajuda e segurança também nas áreas logadas", async ({ page }) => {
    await login(page, "jovem@vunimo.test");
    await page.getByRole("button", { name: /Ajuda e segurança/ }).click();
    await expect(page.getByRole("dialog", { name: "Ajuda e segurança" }).getByText("Disque 100")).toBeVisible();
  });
});
