import { expect, test, type Page } from "@playwright/test";
import { isMobile, login, testDb } from "./helpers";

const LU = "jovem@vunimo.test";

/** Data de hoje do servidor (mesma regra da página) e deslocamentos, em AAAA-MM-DD. */
function isoToday(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function scrollInSteps(page: Page, total: number, step = 120) {
  const n = Math.ceil(Math.abs(total) / step);
  for (let i = 0; i < n; i++) {
    await page.evaluate((s) => window.scrollBy(0, s), Math.sign(total) * step);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(500);
}

const indicatorMatchesActive = (page: Page, navSelector: string) =>
  page.evaluate((sel) => {
    const nav = [...document.querySelectorAll<HTMLElement>(sel)].find((n) => n.offsetParent !== null || getComputedStyle(n).position === "fixed")!;
    const ind = nav.querySelector<HTMLElement>(".vn-ind")!;
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]')!;
    const a = active.getBoundingClientRect();
    const i = ind.getBoundingClientRect();
    return { dx: Math.abs(a.left - i.left), dy: Math.abs(a.top - i.top), visible: ind.hasAttribute("data-visible") };
  }, navSelector);

test.describe("Interações com movimento", () => {
  test.use({ reducedMotion: "no-preference" });

  test("clique dá resposta na hora: onda no botão e pontinhos enquanto envia", async ({ page }) => {
    await page.goto("/entrar");
    const btn = page.getByRole("button", { name: "Entrar" });
    const box = (await btn.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(btn.locator(".vn-ripple")).toHaveCount(1);
    const scale = await btn.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(scale).toBeLessThan(1); // afunda enquanto pressionado
    await page.mouse.up();
    await expect(btn.locator(".vn-ripple")).toHaveCount(0, { timeout: 2000 }); // some sozinha
    // Erro de envio: a mensagem entra com animação
    await expect(page.locator(".vn-msg, .field-input[aria-invalid='true']").first()).toBeVisible();
  });

  test("troca de abas: o indicador desliza até a aba ativa", async ({ page }, info) => {
    const mobile = isMobile(info);
    await login(page, LU);
    await page.goto("/app");
    const navSel = mobile ? 'nav[style*="vn-tabbar"]' : 'aside nav[aria-label="Navegação principal"]';
    const nav = page.locator(navSel);
    const ind = nav.locator(".vn-ind");
    await expect(ind).toHaveAttribute("data-visible", "");
    expect(await ind.evaluate((el) => getComputedStyle(el).transitionDuration)).toContain("0.45s");

    await nav.getByRole("link", { name: "Orientação" }).click();
    await expect(page).toHaveURL(/\/orientar$/);
    await expect(nav.getByRole("link", { name: "Orientação" })).toHaveAttribute("aria-current", "page");
    await page.waitForTimeout(700);
    const m = await indicatorMatchesActive(page, navSel);
    expect(m.visible).toBe(true);
    expect(m.dx).toBeLessThan(2);
    expect(m.dy).toBeLessThan(2);
    // A aba recém-ativada dá um pulinho
    await expect(nav.locator('[aria-current="page"] .vn-tab-icon')).toHaveAttribute("data-active", "");
  });

  test("site público: menu e caixinhas abrem com animação", async ({ page }, info) => {
    await page.goto("/sobre");
    if (isMobile(info)) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await expect(page.locator("#menu-celular")).toHaveAttribute("data-open", "");
      await expect(page.locator("#menu-celular").getByRole("link", { name: "Orientação" })).toBeVisible();
      await page.getByRole("button", { name: "Fechar menu" }).click();
    } else {
      // Traço Lima desliza até o link ativo do topo
      await expect(page.locator(".vn-ind-top")).toHaveAttribute("data-visible", "");
      const m = await indicatorMatchesActive(page, 'header nav[aria-label="Principal"]');
      expect(m.visible).toBe(true);
      expect(m.dx).toBeLessThan(2);
    }
    await page.getByRole("button", { name: "Ajuda e segurança" }).click();
    const sheet = page.getByRole("dialog", { name: "Ajuda e segurança" });
    await expect(sheet).toBeVisible();
    expect(await sheet.locator(".vn-sheet-item").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("vn-step-in");
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("rolagem: a barra recolhe ao descer, volta ao subir e não muda de altura", async ({ page }) => {
    await page.goto("/privacidade");
    const header = page.locator("header.vn-autohide").first();
    const h0 = (await header.boundingBox())!.height;
    await scrollInSteps(page, 900);
    await expect(header).toHaveAttribute("data-scrolled", "");
    await expect(header).toHaveAttribute("data-hidden", "");
    await expect.poll(async () => (await header.boundingBox())!.y).toBeLessThan(-h0 + 2);
    await scrollInSteps(page, -240);
    await expect(header).not.toHaveAttribute("data-hidden", "");
    await expect.poll(async () => (await header.boundingBox())!.y).toBeGreaterThan(-1);
    expect((await header.boundingBox())!.height).toBeCloseTo(h0, 0);
  });

  test("rolagem na página inicial: a barra fica durante a abertura", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header.vn-autohide").first();
    await scrollInSteps(page, 700);
    await expect(header).not.toHaveAttribute("data-hidden", "");
  });

  test("calendário: hoje, escolhido e indisponível; teclado; troca de mês; salva a data", async ({ page }, info) => {
    const db = testDb();
    db.prepare("DELETE FROM timeline_events WHERE user_id = (SELECT id FROM users WHERE email = ?) AND description LIKE 'Teste do calendário%'").run(LU);
    db.close();
    await login(page, LU);
    await page.goto("/app/linha-do-tempo");

    const trigger = page.getByRole("button", { name: /Quando aconteceu/ });
    await expect(trigger).toContainText("(hoje)");
    await trigger.click();
    const cal = page.getByRole("dialog", { name: /\d{4}/ });
    await expect(cal).toBeVisible();
    expect(await cal.evaluate((el) => getComputedStyle(el).animationName)).toMatch(/vn-cal-in|vn-sheet-up/);
    if (isMobile(info)) {
      const b = (await cal.boundingBox())!;
      expect(Math.round(b.y + b.height)).toBeGreaterThanOrEqual(page.viewportSize()!.height - 2); // folha de baixo
    }

    const today = cal.locator('[aria-current="date"]');
    await expect(today).toHaveAttribute("aria-pressed", "true"); // hoje já escolhido
    await expect(today).toBeFocused();
    // Dias depois de hoje ficam indisponíveis (ou o próximo mês fica bloqueado no fim do mês)
    await expect(cal.getByRole("button", { name: "Próximo mês" })).toBeDisabled();

    // Teclado: seta para trás, mês anterior e volta
    await page.keyboard.press("ArrowLeft");
    await expect(cal.locator(`[data-iso="${isoToday(-1)}"]`)).toBeFocused();
    const title = cal.getByRole("heading");
    const month0 = await title.textContent();
    await page.keyboard.press("PageUp");
    await expect(title).not.toHaveText(month0!);
    expect(await cal.locator("tbody").getAttribute("data-dir")).toBe("prev");
    await page.keyboard.press("PageDown");
    await expect(title).toHaveText(month0!);
    // Esc fecha e devolve o foco ao campo
    await page.keyboard.press("Escape");
    await expect(cal).toBeHidden();
    await expect(trigger).toBeFocused();

    // Abre pelo teclado, escolhe ontem com Enter
    await page.keyboard.press("Enter");
    await expect(cal).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await expect(cal).toBeHidden();
    await expect(page.locator('input[name="happenedOn"]')).toHaveValue(isoToday(-1));
    await expect(trigger).not.toContainText("(hoje)");

    await page.getByLabel("Onde", { exact: true }).selectOption("Discord");
    await page.getByLabel("Tipo").selectOption("Ofensas ou xingamentos");
    await page.getByLabel("O que aconteceu").fill("Teste do calendário: mensagem ofensiva no servidor.");
    await page.getByRole("radio", { name: "Ainda não" }).check();
    await page.getByRole("button", { name: "Adicionar à linha do tempo" }).click();
    const item = page.locator(".vn-timeline-item", { hasText: "Teste do calendário" });
    await expect(item).toBeVisible();

    // Apagar usa o diálogo da Vunimo: Voltar cancela, Confirmar apaga
    await item.getByRole("button", { name: "Apagar" }).click();
    const confirm = page.getByRole("dialog", { name: /Apagar este registro/ });
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Voltar" }).click();
    await expect(confirm).toBeHidden();
    await expect(item).toBeVisible();
    await item.getByRole("button", { name: "Apagar" }).click();
    await confirm.getByRole("button", { name: "Confirmar" }).click();
    await expect(item).toHaveCount(0);
  });
});

test.describe("Com movimento reduzido no sistema", () => {
  test.use({ reducedMotion: "reduce" });

  test("sem onda no clique, abas e barra sem transição, calendário sem animação", async ({ page }, info) => {
    await page.goto("/entrar");
    const btn = page.getByRole("button", { name: "Entrar" });
    const box = (await btn.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await expect(btn.locator(".vn-ripple")).toHaveCount(0);
    await page.mouse.up();

    await login(page, LU);
    await page.goto("/app/linha-do-tempo");
    const navSel = isMobile(info) ? 'nav[style*="vn-tabbar"]' : 'aside nav[aria-label="Navegação principal"]';
    const dur = await page.locator(`${navSel} .vn-ind`).evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
    expect(dur).toBeLessThan(0.01);

    await page.getByRole("button", { name: /Quando aconteceu/ }).click();
    const cal = page.getByRole("dialog", { name: /\d{4}/ });
    await expect(cal).toBeVisible();
    expect(parseFloat(await cal.evaluate((el) => getComputedStyle(el).animationDuration))).toBeLessThan(0.01);
    await page.keyboard.press("Escape");
    await expect(cal).toBeHidden();
  });
});
