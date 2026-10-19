import { expect, test, type Page } from "@playwright/test";

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const DRAFT = {
  v: 1, income: 500000, currency: "XOF", method: "50-30-20",
  custom: [{ name: "need", kind: "need", pct: 100 }], essentials: null, hasDebt: null, savings: null,
};

async function signIn(page: Page) {
  await page.goto("/fr/connexion");
  await page.getByLabel("Adresse email").fill(`motion.${Date.now()}.${Math.floor(Math.random() * 1e6)}@exemple.com`);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Recevoir mon lien de connexion" }).click();
  await page.getByRole("link", { name: "Ouvrir le lien (développement)" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
}

/** Éléments visibles (boîte non nulle) dont l'opacité calculée est < 1, une fois l'entrée de page terminée. */
const faded = async (page: Page) => {
  await expect(page.locator("main [data-page]:visible")).toHaveCSS("opacity", "1");
  return page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((el) => el.getClientRects().length && Number(getComputedStyle(el).opacity) < 1)
      .map((el) => el.outerHTML.slice(0, 80)),
  );
};

test("reduced motion shows final state", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chaque mois, un pas de plus.");
  expect(await faded(page)).toEqual([]);

  await page.addInitScript((d) => localStorage.setItem("sf-simulation", JSON.stringify(d)), DRAFT);
  await signIn(page);
  await expect(page.getByRole("listitem").filter({ hasText: /^Épargne/ })).toContainText(nf(100000));
  expect(await faded(page)).toEqual([]);
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("page transition runs and settles", async ({ page }) => {
    await page.goto("/fr");
    // Next garde la page précédente montée mais cachée (Activity) : on ne regarde que la page affichée.
    const content = page.locator("main [data-page]:visible");
    await expect(content).toHaveCount(1);
    // Premier chargement : pas d'animation d'entrée (le HTML serveur reste affiché, aucun flash).
    await expect(content).toHaveCSS("opacity", "1");
    await expect(content).toHaveCSS("transform", "none");
    // Échantillonne l'état du contenu à chaque image, avant le clic : le template est remonté à la navigation.
    await page.evaluate(() => {
      const seen: string[] = ((window as unknown as { __seen: string[] }).__seen = []);
      const tick = () => {
        const el = [...document.querySelectorAll("main [data-page]")].find((e) => e.checkVisibility());
        if (el) seen.push(`${getComputedStyle(el).opacity}|${getComputedStyle(el).transform}`);
        requestAnimationFrame(tick);
      };
      tick();
    });
    await page.getByRole("link", { name: "Essayer les 6 méthodes" }).first().click();
    await expect(page).toHaveURL(/\/fr\/simulateur/);
    await page.waitForTimeout(800); // > 380 ms d'entrée
    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);
    expect(seen.some((s) => s !== "1|none")).toBe(true); // l'animation a bien eu lieu
    expect(seen.at(-1)).toBe("1|none");
    await expect(content).toHaveCSS("opacity", "1");
    await expect(content).toHaveCSS("transform", "none");
  });

  test("no orphan ScrollTrigger after navigation", async ({ page }) => {
    const count = () => page.evaluate(() => window.__sfMotion?.ScrollTrigger.getAll().length ?? -1);
    await page.goto("/fr");
    await expect.poll(count).toBeGreaterThanOrEqual(0);
    const base = await count();
    await page.getByRole("link", { name: "Essayer les 6 méthodes" }).first().click();
    await expect(page).toHaveURL(/\/fr\/simulateur/);
    await page.goBack();
    await expect(page).toHaveURL(/\/fr$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(count).toBe(base);
  });

  test("first load never hides painted content", async ({ page }) => {
    // Échantillonne dès le HTML serveur jusqu'après l'hydratation : titre et montant restent immobiles.
    await page.addInitScript(() => {
      const seen: string[] = ((window as unknown as { __seen: string[] }).__seen = []);
      const style = (el: Element | null) => {
        if (!el) return "absent";
        const s = getComputedStyle(el);
        return `${s.opacity}|${s.transform}|${s.clipPath}`;
      };
      const tick = () => {
        const h1 = document.querySelector("h1");
        const count = document.querySelector("[data-count]");
        if (h1 && count)
          seen.push([h1.innerHTML, style(h1), count.textContent, style(count), style(count.parentElement)].join(" ; "));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto("/fr/labo-motion");
    await page.waitForTimeout(1200);
    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);
    expect(seen.length).toBeGreaterThan(20);
    const still = "1|none|none";
    // Espaces insécables du formatage fr normalisés.
    expect([...new Set(seen.map((s) => s.replace(/\s/g, " ")))]).toEqual([`Labo motion ; ${still} ; 500 000 F CFA ; ${still} ; ${still}`]);
  });

  test("CountUp counts, then follows a format change", async ({ page }) => {
    const eur = (minor: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(minor / 100);
    await page.goto("/fr/labo-motion");
    const count = page.locator("[data-count]");
    await expect(count).toHaveText("500 000 F CFA");
    await page.getByRole("button", { name: "Ajouter" }).click();
    await page.waitForTimeout(100);
    expect(await count.textContent()).not.toBe("623 457 F CFA"); // défile
    await expect(count).toHaveText("623 457 F CFA");
    await page.getByRole("button", { name: "EUR" }).click(); // après le défilement
    await expect(count).toHaveText(eur(623457));
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(count).toHaveText(eur(746914));
  });

  test("format change during a count ends on the new format", async ({ page }) => {
    const eur = (minor: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(minor / 100);
    await page.goto("/fr/labo-motion");
    await page.getByRole("button", { name: "Ajouter" }).click();
    await page.getByRole("button", { name: "EUR" }).click(); // pendant le défilement
    await page.waitForTimeout(1500);
    await expect(page.locator("[data-count]")).toHaveText(eur(623457));
  });

  test("mobile account nav stays pinned during a page transition", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await signIn(page);
    await page.evaluate(() => {
      const seen: number[] = ((window as unknown as { __navBottoms: number[] }).__navBottoms = []);
      const tick = () => {
        for (const nav of document.querySelectorAll('nav[aria-label="Navigation du compte"]'))
          if (nav.checkVisibility()) seen.push(Math.round(nav.getBoundingClientRect().bottom - window.innerHeight));
        requestAnimationFrame(tick);
      };
      tick();
    });
    await page.getByRole("navigation", { name: "Navigation du compte" }).getByRole("link", { name: "Historique" }).click();
    await expect(page).toHaveURL(/\/fr\/historique$/);
    await page.waitForTimeout(800);
    const offsets = await page.evaluate(() => (window as unknown as { __navBottoms: number[] }).__navBottoms);
    expect(offsets.length).toBeGreaterThan(20);
    expect([...new Set(offsets)]).toEqual([0]);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("content visible without JS", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chaque mois, un pas de plus.");
    for (const h of await page.getByRole("heading", { level: 2 }).all()) await expect(h).toBeVisible();
    expect(await faded(page)).toEqual([]);
  });
});
