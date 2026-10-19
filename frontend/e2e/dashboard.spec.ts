import { expect, test, type Page } from "@playwright/test";

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const unique = () => `kofi.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.com`;
const DRAFT = {
  v: 1, income: 500000, currency: "XOF", method: "50-30-20",
  custom: [{ name: "need", kind: "need", pct: 100 }], essentials: null, hasDebt: null, savings: null,
};

async function signIn(page: Page, draft?: object) {
  if (draft) await page.addInitScript((d) => localStorage.setItem("sf-simulation", JSON.stringify(d)), draft);
  await page.goto("/fr/connexion");
  await page.getByLabel("Adresse email").fill(unique());
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Recevoir mon lien de connexion" }).click();
  await page.getByRole("link", { name: "Ouvrir le lien (développement)" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
}

const ym = (back: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - back);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const monthName = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1)));
};

async function seedClosed(page: Page) {
  const plan = { income: 500000, currency: "XOF", method: "50-30-20" };
  for (const [back, actuals] of [[2, [250000, 150000, 100000]], [1, [240000, 140000, 120000]]] as const) {
    const put = await page.request.put(`/api/months/${ym(back)}`, { data: plan });
    expect(put.ok()).toBe(true);
    const close = await page.request.post(`/api/months/${ym(back)}/close`, { data: { actuals } });
    expect(close.ok()).toBe(true);
  }
}

test("first run after signup imports the draft", async ({ page }) => {
  await signIn(page, DRAFT);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bienvenue, votre budget");
  await expect(page.getByRole("listitem").filter({ hasText: /^Épargne/ })).toContainText(nf(100000));
  await expect(page.getByRole("img", { name: /sous l.horizon : 0 cran sur 12/ })).toBeVisible();
  await expect(page.getByText("Contenu éducatif, pas un conseil financier personnalisé.").first()).toBeVisible();
});

test("empty account invites to simulate", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Faites votre première simulation");
  await page.getByRole("link", { name: "Ouvrir le simulateur" }).click();
  await expect(page).toHaveURL(/\/fr\/simulateur$/);
});

test("dashboard shows sun and month", async ({ page }) => {
  await signIn(page);
  await seedClosed(page);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Votre épargne progresse depuis ${monthName(ym(2))}.`);
  await expect(page.getByRole("img", { name: "Le soleil est monté de 2 crans sur 12" })).toBeVisible();
  const now = monthName(ym(0));
  await expect(page.getByRole("link", { name: `Faire le bilan de ${now}` })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation du compte" })).toBeVisible();
});

test("reduced motion has no sun animation", async ({ page }) => {
  await signIn(page, DRAFT);
  const sun = page.locator("[data-sun]");
  const duration = () => sun.evaluate((el) => getComputedStyle(el).transitionDuration);
  await expect(sun).toBeVisible();
  expect(parseFloat(await duration())).toBeGreaterThan(0.5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(parseFloat(await duration())).toBeLessThan(0.001); // règle globale : ~0 s
});

test("no horizontal scroll at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await signIn(page);
  await seedClosed(page);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Votre épargne progresse");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
