import { expect, test } from "@playwright/test";

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

test("quick start carries income", async ({ page }) => {
  await page.goto("/fr");
  await page.getByLabel("Votre revenu mensuel net").fill("500 000");
  await expect(page.getByRole("listitem").filter({ hasText: /^Épargne · 20 %/ })).toContainText(nf(100000));
  await page.getByRole("link", { name: "Essayer les 6 méthodes" }).first().click();
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

test("method card preselects its method", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: /6 comptes/ }).first().click();
  await expect(page.getByRole("radio", { name: /Méthode des 6 comptes/ })).toBeChecked();
});

/** Position verticale du soleil du hero et texte du titre, à chaque image dès le HTML serveur. */
async function sampleHero(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const seen: string[] = ((window as unknown as { __hero: string[] }).__hero = []);
    const tick = () => {
      const sun = document.querySelector("[data-hero-sun]");
      const h1 = document.querySelector("h1");
      if (sun && h1) seen.push(`${Math.round(sun.getBoundingClientRect().top)}|${h1.innerHTML}`);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
const heroSeen = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __hero: string[] }).__hero);

test.describe("hero with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("hero animates then settles", async ({ page }) => {
    await sampleHero(page);
    await page.goto("/fr");
    await page.waitForTimeout(2000); // séquence ≤ 1,4 s
    const seen = await heroSeen(page);
    const last = seen.at(-1)!;
    expect(seen.some((s) => s.split("|")[0] !== last.split("|")[0])).toBe(true); // le soleil a bougé
    expect(last.split("|")[1]).toBe("Chaque mois, un pas de plus."); // découpage annulé, slogan entier
    await expect(page.locator("[data-hero-sun]")).toHaveCSS("transform", "none");
    await expect(page.getByRole("link", { name: "Essayer les 6 méthodes" }).first()).toBeVisible();
    // Position finale = position du rendu serveur (mouvement réduit).
    const finalTop = Number(last.split("|")[0]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect.poll(async () => Math.round((await page.locator("[data-hero-sun]").boundingBox())!.y)).toBe(finalTop);
  });

  test("quick start updates amounts", async ({ page }) => {
    await page.goto("/fr");
    const savings = page.getByRole("listitem").filter({ hasText: /^Épargne · 20 %/ });
    // Échantillonne le montant à chaque image : il doit passer par des valeurs intermédiaires.
    await savings.evaluate((el) => {
      const w = window as unknown as { __texts: string[] };
      w.__texts = [];
      const tick = () => { w.__texts.push(el.textContent ?? ""); requestAnimationFrame(tick); };
      tick();
    });
    await page.getByLabel("Votre revenu mensuel net").fill("800 000");
    await expect(savings).toContainText(nf(160000));
    const texts = await page.evaluate(() => (window as unknown as { __texts: string[] }).__texts);
    expect(new Set(texts).size).toBeGreaterThan(2); // défile
  });

  test("pinned section only on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/fr");
    await expect(page.locator(".pin-spacer")).toHaveCount(1);
    // L'épinglage réserve sa course : la suite de la page n'est pas recouverte (parent en flex).
    expect(parseFloat(await page.locator(".pin-spacer").evaluate((el) => getComputedStyle(el).paddingBottom))).toBeGreaterThan(0);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/fr");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    // Les étapes finissent entièrement visibles au défilement.
    const steps = page.getByRole("heading", { level: 3 });
    for (const s of await steps.all()) {
      await s.scrollIntoViewIfNeeded();
      await expect(s).toBeVisible();
    }
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(800);
    for (const li of await page.locator("[data-step]").all()) await expect(li).toHaveCSS("clip-path", "none");
  });
});

test("hero static under reduced motion", async ({ page }) => {
  await sampleHero(page);
  await page.goto("/fr");
  await page.waitForTimeout(1500);
  const seen = await heroSeen(page);
  expect(seen.length).toBeGreaterThan(20);
  expect(new Set(seen).size).toBe(1);
  expect(seen[0].split("|")[1]).toBe("Chaque mois, un pas de plus.");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});
