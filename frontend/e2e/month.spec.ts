import { expect, test, type Page } from "@playwright/test";

const unique = () => `kofi.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.com`;
const ym = new Date().toISOString().slice(0, 7);
const PLAN = { income: 500000, currency: "XOF", method: "50-30-20" };

async function setup(page: Page) {
  await page.goto("/fr/connexion");
  await page.getByLabel("Adresse email").fill(unique());
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Recevoir mon lien de connexion" }).click();
  await page.getByRole("link", { name: "Ouvrir le lien (développement)" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
  expect((await page.request.put(`http://127.0.0.1:8100/api/months/${ym}`, { data: PLAN })).ok()).toBe(true);
  await page.goto(`/fr/bilan/${ym}`);
}

test("close month happy path", async ({ page }) => {
  await setup(page);
  await expect(page.getByRole("button", { name: "Vérifiez les montants pour clôturer" })).toBeDisabled();
  await page.getByRole("button", { name: "Tout s’est passé comme prévu" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Total" })).toContainText("20");
  await page.getByRole("radio", { name: "4 sur 5" }).click();
  await page.getByRole("button", { name: /Clôturer/ }).click();
  await expect(page).toHaveURL(new RegExp(`/fr/bilan/${ym}/termine$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Un pas de plus.");
  await expect(page.getByRole("img", { name: /cran : 1 sur 12/ })).toBeVisible();
  await expect(page.getByText("Mois tenu !")).toBeVisible();
  await page.reload(); // direct visit works
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Un pas de plus.");
  await expect(page.getByRole("link", { name: "Voir mon tableau de bord" })).toBeVisible();
});

test("mismatch keeps inputs", async ({ page }) => {
  await setup(page);
  await page.route("**/api/months/*/close", (r) => r.fulfill({ status: 422, json: { detail: "totals_mismatch" } }));
  await page.getByRole("button", { name: "Tout s’est passé comme prévu" }).click();
  await page.getByLabel("Ce qui a bien marché").fill("Courses en liste");
  await page.getByRole("button", { name: /Clôturer/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: /./ })).toContainText("ne correspondent pas");
  await expect(page.getByLabel("Ce qui a bien marché")).toHaveValue("Courses en liste");
  await expect(page.getByLabel("Épargne", { exact: true })).toHaveValue(/100/);
});

test("locked month message", async ({ page }) => {
  await setup(page);
  await page.route("**/api/months/*/close", (r) => r.fulfill({ status: 409, json: { detail: "locked" } }));
  await page.getByRole("button", { name: "Tout s’est passé comme prévu" }).click();
  await page.getByRole("button", { name: /Clôturer/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: /./ })).toContainText("verrouillé");
  await expect(page.getByLabel("Épargne", { exact: true })).toHaveValue(/100/);
});

test("double click sends once", async ({ page }) => {
  await setup(page);
  let n = 0;
  await page.route("**/api/months/*/close", async (r) => {
    n++;
    await new Promise((res) => setTimeout(res, 500));
    await r.continue();
  });
  await page.getByRole("button", { name: "Tout s’est passé comme prévu" }).click();
  await page.getByRole("button", { name: /Clôturer/ }).dblclick();
  await expect(page).toHaveURL(/termine$/);
  expect(n).toBe(1);
});

test("no horizontal scroll at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await setup(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
