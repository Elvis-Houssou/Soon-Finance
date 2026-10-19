import { expect, test } from "@playwright/test";

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

test("index lists 5 articles and 6 methods", async ({ page }) => {
  await page.goto("/fr/apprendre");
  await expect(page.getByRole("heading", { level: 1, name: "Apprendre" })).toBeVisible();
  await expect(page.locator("main a[href^='/fr/apprendre/']")).toHaveCount(11);
  await expect(page.getByRole("region", { name: "Les 6 méthodes" }).getByRole("link")).toHaveCount(6);
  await expect(page.getByText(/Contenu éducatif, pas un conseil financier personnalisé\. Vérifiez les frais/)).toBeVisible();
});

test("method sheet shows computed example", async ({ page }) => {
  await page.goto("/fr/apprendre/50-30-20");
  const ex = page.getByRole("region", { name: /Exemple avec/ });
  await expect(ex).toContainText(nf(250000));
  await expect(ex).toContainText(nf(150000));
  await expect(ex).toContainText(nf(100000));
  await expect(ex).toContainText(nf(1200000));
});

test("soon sheet carries the warning and sub-envelopes", async ({ page }) => {
  await page.goto("/fr/apprendre/soon-10-70-20");
  await expect(page.getByRole("region", { name: /Exemple avec/ })).toContainText(nf(175000));
  await expect(page.getByText(/dépenses essentielles sont déjà couvertes/).first()).toBeVisible();
});

test("try with my income preselects method", async ({ page }) => {
  await page.goto("/fr/apprendre/80-20");
  await page.getByRole("link", { name: "Essayer avec mon revenu" }).click();
  await expect(page).toHaveURL(/\/fr\/simulateur/);
  await expect(page.getByRole("radio", { name: /Méthode 80\/20/ })).toBeChecked();
});

test("simulator understand link is always active", async ({ page }) => {
  await page.goto("/fr/simulateur?methode=80-20");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await page.getByRole("link", { name: "Comprendre cette méthode" }).click();
  await expect(page).toHaveURL(/\/fr\/apprendre\/80-20$/);
});

test("unknown slug is 404", async ({ page }) => {
  const res = await page.goto("/fr/apprendre/xyz");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page introuvable" })).toBeVisible();
});

test("english pages have no french", async ({ page }) => {
  for (const path of ["/en/apprendre", "/en/apprendre/50-30-20", "/en/apprendre/types-de-placements"]) {
    await page.goto(path);
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/[éèêàçôùâî]|\b(vous|votre|vos|les|des|une|pour|avec|méthode)\b/i);
  }
});

test("search filters entries", async ({ page }) => {
  await page.goto("/fr/apprendre");
  // fill() avant l'hydratation est perdu : on réessaie jusqu'à ce que le filtre réagisse.
  await expect(async () => {
    await page.getByRole("searchbox", { name: "Rechercher" }).fill("tontine");
    await expect(page.locator("main a[href^='/fr/apprendre/']")).toHaveCount(1, { timeout: 1000 });
  }).toPass();
  await expect(page.getByRole("status")).toContainText("1 résultat");
  await page.getByRole("searchbox", { name: "Rechercher" }).fill("zzzz");
  await expect(page.getByRole("status")).toContainText("Aucun résultat");
});

for (const path of ["/fr/apprendre", "/fr/apprendre/soon-10-70-20", "/en/apprendre/risques-frais-duree"]) {
  test(`no horizontal scroll at 360px (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
}
