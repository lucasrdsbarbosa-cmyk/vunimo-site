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

/** O indicador (.vn-ind) está dentro do item ativo e alinhado a ele. */
const indicatorMatchesActive = (page: Page, navSelector: string) =>
  page.evaluate((sel) => {
    const nav = document.querySelector<HTMLElement>(sel)!;
    const ind = nav.querySelector<HTMLElement>(".vn-ind")!;
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]')!;
    const host = active.closest("li") ?? active;
    const a = host.getBoundingClientRect();
    const i = ind.getBoundingClientRect();
    return { dx: Math.abs(a.left - i.left), dy: Math.abs(a.top - i.top), count: nav.querySelectorAll(".vn-ind").length };
  }, navSelector);

type Sample = { x: number; y: number; o: number; t: string };
/** Grava, quadro a quadro, posição/opacidade/transform do primeiro elemento que casa com o seletor. */
async function startSampling(page: Page, selector: string, ms: number) {
  await page.evaluate(
    ([sel, dur]) => {
      const w = window as unknown as { __samples: Sample[] };
      w.__samples = [];
      const end = performance.now() + (dur as number);
      const loop = () => {
        const el = document.querySelector<HTMLElement>(sel as string);
        if (el) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          w.__samples.push({ x: r.left, y: r.top, o: Number(cs.opacity), t: cs.transform });
        }
        if (performance.now() < end) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    [selector, ms] as const,
  );
}
const readSamples = (page: Page) => page.evaluate(() => (window as unknown as { __samples: Sample[] }).__samples);
const between = (v: number, a: number, b: number) => v > Math.min(a, b) + 2 && v < Math.max(a, b) - 2;

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
    await expect(nav.locator(".vn-ind")).toHaveCount(1);
    const from = (await nav.locator(".vn-ind").boundingBox())!;
    const to = (await nav.getByRole("link", { name: "Orientação" }).locator("xpath=..").boundingBox())!;

    // O mesmo indicador (layoutId do Motion) percorre o caminho entre as abas
    await startSampling(page, `${navSel} .vn-ind`, 1200);
    await nav.getByRole("link", { name: "Orientação" }).click();
    await expect(page).toHaveURL(/\/orientar$/);
    await expect(nav.getByRole("link", { name: "Orientação" })).toHaveAttribute("aria-current", "page");
    await page.waitForTimeout(1300);
    const samples = await readSamples(page);
    const axis = mobile ? "x" : "y";
    expect(samples.some((s) => between(s[axis], from[axis], to[axis]))).toBe(true);
    const m = await indicatorMatchesActive(page, navSel);
    expect(m.count).toBe(1);
    expect(m.dx).toBeLessThan(2);
    expect(m.dy).toBeLessThan(2);
    // A aba recém-ativada dá um pulinho
    await expect(nav.locator('[aria-current="page"] [data-active]')).toHaveCount(1);
  });

  test("site público: menu e caixinhas abrem com animação", async ({ page }, info) => {
    await page.goto("/sobre");
    if (isMobile(info)) {
      // Gaveta: altura animada pelo Motion, itens em sequência; Esc fecha e devolve o foco
      await startSampling(page, "#menu-celular", 700);
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await expect(page.locator("#menu-celular")).toHaveAttribute("data-open", "");
      await expect(page.locator("#menu-celular").getByRole("link", { name: "Orientação" })).toBeVisible();
      await page.waitForTimeout(750);
      expect((await readSamples(page)).length).toBeGreaterThan(3);
      await page.keyboard.press("Escape");
      await expect(page.locator("#menu-celular")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
    } else {
      // Traço Lima sob o link ativo do topo
      await expect(page.locator(".vn-ind-top")).toHaveCount(1);
      const m = await indicatorMatchesActive(page, 'header nav[aria-label="Principal"]');
      expect(m.dx).toBeLessThan(2);
    }
    // Painel de ajuda: o conteúdo entra em sequência (opacidade sobe de 0 a 1)
    await startSampling(page, '[aria-labelledby="help-title"] h3', 900);
    await page.getByRole("button", { name: "Ajuda e segurança" }).click();
    const sheet = page.getByRole("dialog", { name: "Ajuda e segurança" });
    await expect(sheet).toBeVisible();
    await page.waitForTimeout(950);
    const ops = (await readSamples(page)).map((s) => s.o);
    expect(Math.min(...ops)).toBeLessThan(0.5);
    expect(ops.at(-1)).toBe(1);
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
    await startSampling(page, ".vn-cal", 600);
    await trigger.click();
    const cal = page.getByRole("dialog", { name: /\d{4}/ });
    await expect(cal).toBeVisible();
    await page.waitForTimeout(650);
    // Entrada animada: no computador aparece e cresce; no celular sobe de baixo
    const calSamples = await readSamples(page);
    expect(calSamples.some((s) => (isMobile(info) ? s.t !== "none" && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(s.t) : s.o < 1))).toBe(true);
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

test.describe("Páginas sem erros de execução", () => {
  test.use({ reducedMotion: "no-preference" });

  test("páginas públicas e da área do jovem abrem, rolam e revelam o conteúdo sem erros", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`console: ${m.text()}`);
    });
    const visit = async (path: string) => {
      await page.goto(path);
      // Rola até o fim, em passos, como uma pessoa faria
      for (let i = 0; i < 40; i++) {
        const atEnd = await page.evaluate(() => {
          window.scrollBy(0, 400);
          return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        });
        await page.waitForTimeout(80);
        if (atEnd) break;
      }
      await page.waitForTimeout(700);
      // Tudo que estava escondido para a revelação ficou visível
      // (a abertura da página inicial tem estados próprios, controlados pelo GSAP, e fica de fora)
      const hidden = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("main *, section *")]
          .filter((el) => !el.closest(".vn-hero") && el.style.opacity === "0" && el.getBoundingClientRect().height > 0)
          .map((el) => `${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 40)}`),
      );
      expect(hidden, `elementos ainda invisíveis em ${path}`).toEqual([]);
    };
    for (const p of ["/", "/comecar", "/orientar", "/orientar/bloquear", "/conectar", "/sobre", "/profissionais", "/pausa"]) await visit(p);
    await login(page, LU);
    for (const p of ["/app", "/app/linha-do-tempo", "/app/plano", "/app/diario", "/app/conversa", "/app/pedidos"]) await visit(p);
    expect(errors).toEqual([]);
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
    await page.goto("/app");
    // Indicador da aba: troca de lugar sem percorrer o caminho
    const navSel = isMobile(info) ? 'nav[style*="vn-tabbar"]' : 'aside nav[aria-label="Navegação principal"]';
    const nav = page.locator(navSel);
    const from = (await nav.locator(".vn-ind").boundingBox())!;
    const to = (await nav.getByRole("link", { name: "Orientação" }).locator("xpath=..").boundingBox())!;
    await startSampling(page, `${navSel} .vn-ind`, 1000);
    await nav.getByRole("link", { name: "Orientação" }).click();
    await expect(nav.getByRole("link", { name: "Orientação" })).toHaveAttribute("aria-current", "page");
    await page.waitForTimeout(1050);
    const axis = isMobile(info) ? "x" : "y";
    expect((await readSamples(page)).some((s) => between(s[axis], from[axis], to[axis]))).toBe(false);

    // Calendário: sem deslocamento nem escala ao abrir
    await page.goto("/app/linha-do-tempo");
    await startSampling(page, ".vn-cal", 500);
    await page.getByRole("button", { name: /Quando aconteceu/ }).click();
    const cal = page.getByRole("dialog", { name: /\d{4}/ });
    await expect(cal).toBeVisible();
    await page.waitForTimeout(550);
    for (const s of await readSamples(page)) expect(s.t === "none" || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(s.t)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(cal).toBeHidden();
  });
});
