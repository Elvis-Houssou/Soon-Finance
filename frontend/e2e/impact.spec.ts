import { expect, test, type Page } from "@playwright/test";

const ADMIN = "admin.e2e@exemple.com"; // = ADMIN_EMAILS du backend e2e (playwright.config.ts)
const unique = () => `ama.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.com`;

async function signIn(page: Page, email: string) {
  await page.goto("/fr/connexion");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Recevoir mon lien de connexion" }).click();
  await page.getByRole("link", { name: "Ouvrir le lien (développement)" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
}

test("admin sees impact", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await signIn(page, ADMIN);
  await page.goto("/fr/admin/impact");
  await expect(page.getByRole("heading", { level: 1, name: "Est-ce que Soon Finance aide vraiment ?" })).toBeVisible();
  const a = page.getByRole("region", { name: "A · Épargne réelle" });
  await expect(a).toBeVisible();
  await expect(a.getByText("—").first()).toBeVisible(); // moins de 5 personnes : masqué
  await expect(page.getByText("Moins de 5 personnes : chiffre masqué pour protéger la vie privée")).toBeVisible();
  await expect(page.getByRole("region", { name: "C · Utilisation" })).toBeVisible();
  await expect(page.getByRole("region", { name: "B · Fidélité par cohorte" })).toBeVisible();
  for (const select of ["Période", "Devise", "Langue"]) {
    const box = await page.getByRole("combobox", { name: select }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole("combobox", { name: "Devise" }).selectOption("EUR");
  await expect(page.getByRole("region", { name: "A · Épargne réelle" }).getByText("—").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.close();
});

test("non admin gets 404 page", async ({ browser }) => {
  const page = await browser.newPage();
  await signIn(page, unique());
  // Requête document brute : vrai statut 404 et aucun balisage admin dans le HTML.
  const res = await page.request.get("/fr/admin/impact");
  expect(res.status()).toBe(404);
  const html = await res.text();
  expect(html).not.toContain("Est-ce que Soon Finance aide vraiment");
  expect(html).not.toContain("Admin Soon");
  await page.goto("/fr/admin/impact");
  await expect(page.getByRole("heading", { level: 1, name: "Page introuvable" })).toBeVisible();
  await expect(page.getByText("Admin Soon")).toHaveCount(0);
  await expect(page.getByText("Est-ce que Soon Finance aide vraiment ?")).toHaveCount(0);
  await page.close();
});

test("signed-out visitor is sent to login", async ({ page }) => {
  await page.goto("/fr/admin/impact");
  await expect(page).toHaveURL(/\/fr\/connexion\?next=/);
});
