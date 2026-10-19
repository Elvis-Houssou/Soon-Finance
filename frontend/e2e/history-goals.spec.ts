import { expect, test, type Page } from "@playwright/test";

const unique = () => `kofi.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.com`;
const ym = (fwd: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + fwd);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const label = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  const name = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1)));
  return `${name} ${y}`;
};
const PLAN = { income: 500000, currency: "XOF", method: "50-30-20" };

async function signIn(page: Page) {
  await page.goto("/fr/connexion");
  await page.getByLabel("Adresse email").fill(unique());
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Recevoir mon lien de connexion" }).click();
  await page.getByRole("link", { name: "Ouvrir le lien (développement)" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
}
async function plan(page: Page, key = ym(0)) {
  expect((await page.request.put(`http://127.0.0.1:8100/api/months/${key}`, { data: PLAN })).ok()).toBe(true);
}
async function seedClosed(page: Page) {
  for (const [back, actuals] of [[-2, [250000, 150000, 100000]], [-1, [240000, 140000, 120000]]] as const) {
    await plan(page, ym(back));
    expect((await page.request.post(`http://127.0.0.1:8100/api/months/${ym(back)}/close`, { data: { actuals } })).ok()).toBe(true);
  }
  await plan(page);
}
const goal = (page: Page, body: object) => page.request.post("http://127.0.0.1:8100/api/goals", { data: { saved: 0, ...body } });

test("history lists closed months", async ({ page }) => {
  await signIn(page);
  await seedClosed(page);
  await page.goto("/fr/historique");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Historique");
  await expect(page.getByRole("img", { name: /Taux d.épargne/ })).toBeVisible();
  await expect(page.getByText("Clôturé · 20 %")).toBeVisible();
  await expect(page.getByText("Clôturé · 24 %")).toBeVisible();
  await expect(page.getByText("En cours", { exact: true }).first()).toBeVisible();
});

test("history empty state", async ({ page }) => {
  await signIn(page);
  await page.goto("/fr/historique");
  await expect(page.getByRole("heading", { name: "Votre premier bilan apparaîtra ici" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Taux d.épargne/ })).toHaveCount(0);
});

test("create goal shows monthly amount", async ({ page }) => {
  await signIn(page);
  await plan(page);
  await page.goto("/fr/objectifs");
  await expect(page.getByRole("heading", { name: "Donnez un but à votre épargne" })).toBeVisible();
  await page.getByLabel("Nom").fill("Ordinateur");
  await page.getByLabel(/^Montant/).fill("450000");
  await page.getByLabel("Dans combien de mois").fill("6");
  await expect(page.getByRole("status").filter({ hasText: "par mois" })).toContainText(/75\s000/);
  await page.getByLabel("Dans combien de mois").fill("3");
  await expect(page.getByRole("status").filter({ hasText: "plus que votre épargne prévue" })).toBeVisible();
  await page.getByRole("button", { name: "Allonger la durée" }).click();
  await expect(page.getByLabel("Dans combien de mois")).toHaveValue("5");
  await page.getByRole("button", { name: "Ajouter l’objectif" }).click();
  await expect(page.getByRole("heading", { name: "Ordinateur" })).toBeVisible();
  await expect(page.getByText("1 objectif sur 3 possibles")).toBeVisible();
});

test("goal behind offers postpone", async ({ page }) => {
  await signIn(page);
  await plan(page);
  expect((await goal(page, { label: "Voiture", target: 1000000, deadline: ym(2) })).ok()).toBe(true);
  await page.goto("/fr/objectifs");
  await expect(page.getByText(`vous l’atteindrez en ${label(ym(10))}`)).toBeVisible();
  const req = page.waitForRequest((r) => r.method() === "PATCH" && r.url().includes("/api/goals/"));
  await page.getByRole("button", { name: `Décaler à ${label(ym(10))}` }).click();
  expect((await req).postDataJSON()).toEqual({ deadline: ym(10) });
  await expect(page.getByText("vous l’atteindrez en")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Épargner plus chaque mois" })).toHaveCount(0);
});

test("fourth goal is refused", async ({ page }) => {
  await signIn(page);
  await plan(page);
  for (const n of [1, 2, 3]) expect((await goal(page, { label: `But ${n}`, target: 100000, deadline: ym(24) })).ok()).toBe(true);
  await page.goto("/fr/objectifs");
  await expect(page.getByText("3 objectifs sur 3 possibles")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "limite de 3 objectifs" })).toBeVisible();
  await expect(page.getByLabel("Nom")).toHaveCount(0);
});

test("delete goal asks confirmation", async ({ page }) => {
  await signIn(page);
  await plan(page);
  expect((await goal(page, { label: "Mariage", target: 100000, deadline: ym(24) })).ok()).toBe(true);
  await page.goto("/fr/objectifs");
  await page.getByRole("button", { name: "Supprimer Mariage" }).click();
  await expect(page.getByText("Supprimer cet objectif ?")).toBeVisible();
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("heading", { name: "Mariage" })).toBeVisible();
  await page.getByRole("button", { name: "Supprimer Mariage" }).click();
  await page.getByRole("button", { name: "Oui, supprimer" }).click();
  await expect(page.getByRole("heading", { name: "Mariage" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Donnez un but à votre épargne" })).toBeVisible();
});

test("no horizontal scroll at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await signIn(page);
  await seedClosed(page);
  expect((await goal(page, { label: "Un objectif au nom assez long pour la ligne", target: 99999999, deadline: ym(3) })).ok()).toBe(true);
  for (const [path, h1] of [["historique", "Historique"], ["objectifs", "Mes objectifs"]]) {
    await page.goto(`/fr/${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    await expect(page.getByRole("status").filter({ hasText: /Chargement/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
