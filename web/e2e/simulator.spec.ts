import { expect, test } from "@playwright/test";

const nf = (n: number, tag: string) => new Intl.NumberFormat(tag).format(n);

test("shows amounts as you type", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500 000");
  await expect(page.getByRole("listitem").filter({ hasText: "Besoins" })).toContainText(nf(250000, "fr-FR"));
});

test("soon model shows warning", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await page.getByRole("radio", { name: /Modèle Soon 10\/70\/20/ }).click();
  await expect(page.getByText("Ce modèle convient si vos dépenses essentielles sont déjà couvertes.")).toBeVisible();
});

test("custom total 95 disables save", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await page.getByRole("radio", { name: /Répartition personnalisée/ }).click();
  await page.getByLabel("Pourcentage, enveloppe 2").fill("20");
  await expect(page.locator("main").getByRole("alert")).toContainText("Il reste 5 % à répartir.");
  await expect(page.getByRole("button", { name: /Ajustez le total/ })).toBeDisabled();
});

test("essentials not covered suggestion", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await page.getByLabel(/Dépenses essentielles/).fill("300000");
  await page.getByRole("radio", { name: /Modèle Soon 10\/70\/20/ }).click();
  await expect(page.getByText(/moins que vos dépenses essentielles/)).toBeVisible();
});

test("api down keeps amounts", async ({ page }) => {
  await page.route("**/api/suggestions", (r) => r.fulfill({ status: 503, body: "" }));
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await expect(page.getByRole("listitem").filter({ hasText: "Besoins" })).toContainText(nf(250000, "fr-FR"));
  await expect(page.getByText("Les conseils sont momentanément indisponibles.")).toBeVisible();
});

test("english formats numbers", async ({ page }) => {
  await page.goto("/en/simulateur");
  await page.getByLabel("Net monthly income").fill("500000");
  await expect(page.getByRole("listitem").filter({ hasText: "Needs" })).toContainText("250,000");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/Revenu|Besoins|Épargne|Enregistrer|conseils|Choisissez/);
});

test("zero income message", async ({ page }) => {
  await page.goto("/fr/simulateur");
  const income = page.getByLabel("Revenu mensuel net");
  await income.fill("500000");
  await income.fill("");
  await expect(page.getByText("Entrez votre revenu mensuel pour voir la répartition.")).toBeVisible();
});

test("mobile 360 no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await page.getByRole("radio", { name: /6 comptes/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("custom split shows translated labels", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await page.getByRole("radio", { name: /Répartition personnalisée/ }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Besoins" })).toBeVisible();
  await page.goto("/en/simulateur");
  await page.getByRole("radio", { name: /Custom split/ }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Needs" })).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(/^(needs|savings|pleasures)\b/m);
  const values = await page.locator("main input, main select").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  expect(values).not.toContain("needs");
});

test("currency switch keeps the displayed amount", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Devise").selectOption("EUR");
  const income = page.getByLabel("Revenu mensuel net");
  await income.fill("1 000,50");
  await page.getByLabel("Devise").selectOption("XOF");
  await expect(income).toHaveValue(nf(1001, "fr-FR"));
  await expect(page.locator("[aria-live=polite]")).toContainText(nf(1001, "fr-FR"));
  await page.getByLabel("Devise").selectOption("EUR");
  await expect(income).toHaveValue(new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(1001));
});
