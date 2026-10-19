import { expect, test, type Page } from "@playwright/test";

const unique = () => `ama.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.com`;

async function signIn(page: Page) {
  await page.goto("/fr/connexion");
  await page.getByLabel("Adresse email").fill(unique());
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Recevoir mon lien de connexion" }).click();
  await page.getByRole("link", { name: "Ouvrir le lien (développement)" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
}

// Few sign-ins on purpose: the backend allows 20 login links per IP per hour across the whole suite.
test.describe.serial("settings", () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await signIn(page);
  });
  test.afterAll(() => page.close());

  test("change first name and currency", async () => {
    await page.goto("/fr/parametres");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Paramètres");
    await expect(page.getByLabel("Adresse email")).toHaveAttribute("readonly", "");
    await page.getByLabel("Prénom").fill("Ama");
    await page.getByLabel("Devise").selectOption("EUR");
    await expect(page.getByRole("status").filter({ hasText: "ne sont pas convertis" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Modifications enregistrées" })).toBeVisible();
    const me = await (await page.request.get("/api/me")).json();
    expect([me.first_name, me.currency]).toEqual(["Ama", "EUR"]);
  });

  test("no horizontal scroll at 360px", async () => {
    await page.goto("/fr/parametres");
    await expect(page.getByLabel("Prénom")).toBeVisible();
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("export downloads json", async () => {
    await page.goto("/fr/parametres");
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Télécharger mes données" }).click();
    expect((await download).suggestedFilename()).toBe("soon-finance-export.json");
  });

  test("language change navigates to the same page", async () => {
    await page.goto("/fr/parametres");
    await page.getByRole("button", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/parametres$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Settings");
    expect((await (await page.request.get("/api/me")).json()).locale).toBe("en");
  });

  test("delete account confirms then signs out", async () => {
    await page.goto("/fr/parametres");
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    await expect(page.getByRole("group", { name: "Supprimer définitivement votre compte ?" })).toBeFocused();
    await expect(page.getByText("Seront effacés")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByText("Seront effacés")).toHaveCount(0);
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    await page.getByRole("button", { name: "Oui, supprimer" }).click();
    await expect(page).toHaveURL(/\/fr$/);
    await page.goto("/fr/parametres");
    await expect(page).toHaveURL(/\/fr\/connexion/);
  });
});
