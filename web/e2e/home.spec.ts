import { expect, test } from "@playwright/test";

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

test("quick start carries income", async ({ page }) => {
  await page.goto("/fr");
  await page.getByLabel("Votre revenu mensuel net").fill("500 000");
  await expect(page.getByRole("listitem").filter({ hasText: /^Épargne · 20 %/ })).toContainText(nf(100000));
  await page.getByRole("link", { name: "Essayer les 6 méthodes" }).first().click();
  await expect(page).toHaveURL(/revenu=500000&devise=XOF/);
  await expect(page.locator("#f-income")).toHaveValue(nf(500000));
});

test("language switch keeps page", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chaque mois, un pas de plus.");
  await page.getByRole("link", { name: /^en$/i }).first().click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("One step further, every month.");
});

test("theme toggle persists", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("button", { name: "Passer en mode sombre" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

for (const lang of ["fr", "en"]) {
  test(`no horizontal scroll at 360px (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/${lang}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
