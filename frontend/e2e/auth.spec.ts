import { expect, test } from "@playwright/test";

const unique = () => `awa.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.com`;

test("full magic link sign-in", async ({ page }) => {
  await page.goto("/fr/connexion");
  await page.getByLabel("Adresse email").fill(unique());
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Recevoir mon lien de connexion" }).click();
  await expect(page.getByRole("heading", { name: "Vérifiez votre boîte mail" })).toBeVisible();
  await page.getByRole("link", { name: "Ouvrir le lien (développement)" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mon tableau de bord" })).toBeVisible();
});

test("consent required", async ({ page }) => {
  await page.goto("/fr/connexion");
  await page.getByLabel("Adresse email").fill(unique());
  await page.getByRole("button", { name: "Recevoir mon lien de connexion" }).click();
  await expect(page.getByText("Cochez la case pour que nous puissions conserver votre budget.")).toBeVisible();
  await expect(page).toHaveURL(/\/fr\/connexion$/);
});

test("expired link page", async ({ page }) => {
  await page.goto("/fr/connexion/lien-expire");
  await expect(page.getByRole("heading", { name: "Ce lien a expiré" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Recevoir un nouveau lien" })).toBeVisible();
});

test("account page redirects when signed out", async ({ page }) => {
  await page.goto("/fr/tableau-de-bord");
  await expect(page).toHaveURL(/\/fr\/connexion\?next=%2Ffr%2Ftableau-de-bord$/);
});

for (const path of ["/fr/connexion", "/fr/connexion/lien-envoye?email=a-very-long-address-that-keeps-going@example-domain-name.com", "/fr/connexion/lien-expire"]) {
  test(`no horizontal scroll at 360px (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
