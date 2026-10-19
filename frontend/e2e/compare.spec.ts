import { expect, test, type Page } from "@playwright/test";
import { formatMoney } from "../src/lib/money";

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const seed = (page: Page, income: number, essentials: number | null) =>
  page.addInitScript(([i, e]) => {
    if (localStorage.getItem("sf-simulation")) return; // keep what the app saved on reload/navigation
    localStorage.setItem("sf-simulation", JSON.stringify({
      v: 1, income: i, currency: "XOF", method: "50-30-20",
      custom: [{ name: "needs", kind: "need", pct: 100 }], essentials: e, hasDebt: null, savings: null,
    }));
  }, [income, essentials] as const);

test("verdict too tight for soon", async ({ page }) => {
  await seed(page, 500000, 300000);
  await page.goto("/fr/comparer");
  const soon = page.getByRole("article", { name: /Soon 10\/70\/20/ });
  await expect(soon).toContainText("Trop serré pour vous");
  await expect(soon).toContainText(nf(200000));
  await expect(page.getByRole("article", { name: /50\/30\/20/ })).toContainText("Couvre vos besoins");
});

test("no essentials shows a hint and no verdict", async ({ page }) => {
  await seed(page, 500000, null);
  await page.goto("/fr/comparer");
  await expect(page.getByText(/Indiquez vos dépenses essentielles dans le simulateur/)).toBeVisible();
  await expect(page.getByText("Couvre vos besoins")).toHaveCount(0);
  await expect(page.getByText("Trop serré pour vous")).toHaveCount(0);
});

test("remove and add method", async ({ page }) => {
  await seed(page, 500000, 300000);
  await page.goto("/fr/comparer");
  await expect(page.getByRole("article")).toHaveCount(3);
  await page.getByRole("button", { name: "Retirer Méthode 70/20/10" }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.getByLabel("Ajouter une méthode").selectOption("80-20");
  await expect(page.getByRole("article")).toHaveCount(3);
  await expect(page.getByLabel("Ajouter une méthode")).toBeDisabled();
});

test("choose method updates simulator", async ({ page }) => {
  await seed(page, 500000, 300000);
  await page.goto("/fr/comparer");
  await page.getByRole("article", { name: /70\/20\/10/ }).getByRole("button", { name: "Choisir cette méthode" }).click();
  await expect(page).toHaveURL(/\/fr\/simulateur/);
  await expect(page.getByRole("radio", { name: /Méthode 70\/20\/10/ })).toBeChecked();
});

test("english and 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seed(page, 500000, 300000);
  await page.goto("/en/comparer?m=50-30-20,soon-10-70-20,bogus,50-30-20");
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(page.getByText("Too tight for you")).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(/Pour vivre|Choisir|Retirer/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("essentials of zero count as unknown", async ({ page }) => {
  await seed(page, 500000, 0);
  await page.goto("/fr/comparer");
  await expect(page.getByText(/Indiquez vos dépenses essentielles/)).toBeVisible();
  await expect(page.getByText("Couvre vos besoins")).toHaveCount(0);
  await expect(page.getByText("Trop serré pour vous")).toHaveCount(0);
});

test("income field survives typing", async ({ page }) => {
  await page.goto("/fr/comparer");
  const income = page.getByLabel("Revenu mensuel net");
  await income.pressSequentially("500000");
  await expect(income).toBeFocused();
  await expect(page.getByRole("article", { name: /50\/30\/20/ })).toContainText(nf(400000));
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("reorders with animation and exact values", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await seed(page, 0, 300000);
    await page.goto("/fr/comparer?m=soon-10-70-20,50-30-20");
    const names = () => page.getByRole("article").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    // Revenu nul : tout est trop serré, l'ordre demandé est gardé.
    await expect.poll(names).toEqual(["Modèle Soon 10/70/20", "Méthode 50/30/20"]);
    await page.evaluate(() => {
      const w = window as unknown as { __moved: boolean };
      w.__moved = false;
      const tick = () => {
        if ([...document.querySelectorAll<HTMLElement>("article")].some((a) => a.style.transform)) w.__moved = true;
        requestAnimationFrame(tick);
      };
      tick();
    });
    await page.getByLabel("Revenu mensuel net").fill("500000");
    // Ce qui couvre les besoins passe devant, avec un mouvement.
    await expect.poll(names).toEqual(["Méthode 50/30/20", "Modèle Soon 10/70/20"]);
    // Les puces suivent l'ordre des colonnes.
    await expect(page.getByRole("list", { name: "Méthodes comparées" }).getByRole("button")).toHaveText([/50\/30\/20/, /Soon 10\/70\/20/]);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __moved: boolean }).__moved)).toBe(true);
    await expect.poll(() => page.locator("article").evaluateAll((els) => els.every((a) => !(a as HTMLElement).style.transform))).toBe(true);
    const first = page.getByRole("article", { name: /50\/30\/20/ });
    await expect(first.locator("dd").first()).toHaveText(formatMoney(400000, "XOF", "fr"));
    await expect(first.locator("dd").nth(1)).toHaveText(formatMoney(1200000, "XOF", "fr"));
    await expect(page.getByRole("article", { name: /Soon/ }).locator("dd").first()).toHaveText(formatMoney(100000, "XOF", "fr"));
    // Meilleure épargne parmi les méthodes qui couvrent les besoins : un seul soleil, posé.
    await expect(page.locator("[data-best]")).toHaveCount(1);
    await expect(first.locator("[data-best]")).toContainText("Meilleure épargne");
    await expect.poll(() => page.locator("[data-best] svg circle").evaluate((c) => c.getAttribute("transform") ?? "")).toBe("");
    expect(errors).toEqual([]);
  });

  test("ties for the best savings all get the sun", async ({ page }) => {
    await seed(page, 500000, 300000);
    await page.goto("/fr/comparer");
    // 50/30/20 et 70/20/10 épargnent toutes deux 20 % et couvrent les besoins ; Soon est trop serré.
    await expect(page.locator("[data-best]")).toHaveCount(2);
    await expect(page.getByRole("article", { name: /Soon/ }).locator("[data-best]")).toHaveCount(0);
  });
});
