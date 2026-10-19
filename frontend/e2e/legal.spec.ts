import { expect, test } from "@playwright/test";

test("privacy page reachable from footer and consent link", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("contentinfo").getByRole("link", { name: "Confidentialité" }).click();
  await expect(page).toHaveURL(/\/fr\/confidentialite$/);
  await expect(page.getByRole("heading", { level: 1, name: "Confidentialité" })).toBeVisible();
  await expect(page.getByText("Nous ne vendons ni ne louons aucune donnée")).toBeVisible();
  await expect(page.getByRole("link", { name: "Paramètres" })).toHaveAttribute("href", "/fr/parametres");
  await page.getByRole("contentinfo").getByRole("link", { name: "Mentions légales" }).click();
  await expect(page).toHaveURL(/\/fr\/confidentialite#mentions$/);

  await page.goto("/fr/connexion");
  const consent = page.getByRole("link", { name: "politique de confidentialité" });
  await expect(consent).toHaveAttribute("href", "/fr/confidentialite");
  const popup = page.waitForEvent("popup");
  await consent.click();
  await expect(await popup).toHaveURL(/\/fr\/confidentialite$/);
});

test("placeholders visible", async ({ page }) => {
  await page.goto("/fr/confidentialite");
  const main = page.locator("main");
  for (const p of ["[RAISON SOCIALE]", "[ADRESSE]", "[N° D'IMMATRICULATION]", "[NOM DU RESPONSABLE]", "[EMAIL DE CONTACT]", "[DATE]"]) {
    await expect(main.getByText(p).first()).toBeVisible();
  }
});

test("table of contents anchors exist", async ({ page }) => {
  await page.goto("/fr/confidentialite");
  const hrefs = await page.getByRole("navigation", { name: "Sommaire" }).getByRole("link").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(3);
  for (const h of hrefs) await expect(page.locator(h!)).toHaveCount(1);
});

test("english version", async ({ page }) => {
  await page.goto("/en/confidentialite");
  await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
  const text = (await page.locator("main").innerText()).replace(/\[[^\]]*\]/g, "");
  expect(text).not.toMatch(/[éèêàçôùâî]|\b(vous|votre|vos|les|des|une|pour|avec|nous)\b/i);
  await page.goto("/en/connexion");
  await expect(page.getByRole("link", { name: "privacy policy" })).toHaveAttribute("href", "/en/confidentialite");
});

for (const path of ["/fr/confidentialite", "/en/confidentialite"]) {
  test(`no horizontal scroll at 360px (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
}
