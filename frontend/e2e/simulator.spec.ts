import { expect, test } from "@playwright/test";
import { formatMoney } from "../src/lib/money";

const nf = (n: number, tag: string) => new Intl.NumberFormat(tag).format(n);
const calc = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Calculer mon plan" }).click();

test("shows amounts as you type", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500 000");
  await calc(page);
  await expect(page.getByRole("listitem").filter({ hasText: "Besoins" })).toContainText(nf(250000, "fr-FR"));
});

test("FIRE 10/70/20 model shows warning", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await calc(page);
  await page.getByRole("radio", { name: /FIRE 10\/70\/20/ }).click();
  await expect(page.getByText("Ce modèle convient si vos dépenses essentielles sont déjà couvertes.")).toBeVisible();
});

test("custom total 95 disables save", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await page.getByRole("radio", { name: /Répartition personnalisée/ }).click();
  await calc(page);
  await page.getByLabel("Pourcentage, enveloppe 2").fill("20");
  await expect(page.locator("main").getByRole("status").filter({ hasText: "Il reste" })).toContainText("Il reste 5 % à répartir.");
  await expect(page.getByRole("button", { name: /Ajustez le total/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Mettre à jour mon plan" })).toBeDisabled();
});

test("the plan appears only after calculating", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await expect(page.getByText("Votre plan apparaîtra ici")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vos propositions d’épargne" })).toHaveCount(0);
  await calc(page);
  await expect(page.getByText("Votre plan est prêt.")).toBeVisible();
  await expect(page.getByText("à mettre de côté chaque mois")).toBeVisible();
  await expect(page.locator("section[aria-label='Votre plan est prêt.']")).toContainText(formatMoney(100000, "XOF", "fr"));
  await expect(page.getByText(`Visez 3 à 6 mois de dépenses essentielles : ${formatMoney(750000, "XOF", "fr")}`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pistes d’investissement" })).toBeVisible();
  await expect(page.getByText("Après votre réserve")).toHaveCount(2);
});

test("pdf download asks to sign up, then returns to the plan", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await calc(page);
  await page.getByRole("button", { name: "Télécharger mon plan (PDF)" }).click();
  await expect(page.getByText("Créez votre compte gratuit pour recevoir votre PDF")).toBeVisible();
  const link = page.getByRole("link", { name: "M’inscrire et télécharger" });
  await expect(link).toHaveAttribute("href", "/fr/connexion?next=%2Ffr%2Fsimulateur%3Fpdf%3D1");
});

test("signed-in users get a real pdf, and the sign-up return starts it", async ({ page }) => {
  await page.route("**/api/me", (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.addInitScript(() => {
    if (!localStorage.getItem("sf-simulation"))
      localStorage.setItem("sf-simulation", JSON.stringify({ v: 1, income: 500000, currency: "XOF", method: "six-jars", custom: [{ name: "a", kind: "need", pct: 100 }], essentials: 200000, hasDebt: true, savings: 50000 }));
  });
  const download = page.waitForEvent("download");
  await page.goto("/fr/simulateur?pdf=1");
  const file = await download;
  expect(file.suggestedFilename()).toBe("plan-soon-finance.pdf");
  const bytes = await (await import("node:fs/promises")).readFile((await file.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(10_000);
  await expect(page.getByText("Votre PDF est téléchargé.")).toBeVisible();
});

test("essentials not covered suggestion", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await calc(page);
  await page.getByLabel(/Dépenses essentielles/).fill("300000");
  await page.getByRole("radio", { name: /FIRE 10\/70\/20/ }).click();
  await expect(page.getByText(/moins que vos dépenses essentielles/)).toBeVisible();
});

test("api down keeps amounts", async ({ page }) => {
  await page.route("**/api/suggestions", (r) => r.fulfill({ status: 503, body: "" }));
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await calc(page);
  await expect(page.getByRole("listitem").filter({ hasText: "Besoins" })).toContainText(nf(250000, "fr-FR"));
  await expect(page.getByText("Les conseils sont momentanément indisponibles.")).toBeVisible();
});

test("english formats numbers", async ({ page }) => {
  await page.goto("/en/simulateur");
  await page.getByLabel("Net monthly income").fill("500000");
  await page.getByRole("button", { name: "Calculate my plan" }).click();
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
  await calc(page);
  await page.getByRole("radio", { name: /6 comptes/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("custom split shows translated labels", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.getByLabel("Revenu mensuel net").fill("500000");
  await calc(page);
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
  await calc(page);
  await page.getByLabel("Devise").selectOption("XOF");
  await expect(income).toHaveValue(nf(1001, "fr-FR"));
  await expect(page.locator("[aria-live=polite]")).toContainText(nf(1001, "fr-FR"));
  await page.getByLabel("Devise").selectOption("EUR");
  await expect(income).toHaveValue(new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(1001));
});

test("prefill rescales the draft, saves it and clears the query", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("sf-simulation"))
      localStorage.setItem("sf-simulation", JSON.stringify({ v: 1, income: 500000, currency: "XOF", method: "50-30-20", custom: [{ name: "a", kind: "need", pct: 100 }], essentials: 200000, hasDebt: null, savings: null }));
  });
  await page.goto("/fr/simulateur?revenu=150000&devise=EUR");
  await expect(page.getByLabel(/Dépenses essentielles/)).toHaveValue(new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(200000));
  expect(new URL(page.url()).search).toBe("");
  const d = JSON.parse(await page.evaluate(() => localStorage.getItem("sf-simulation")!));
  expect([d.currency, d.income, d.essentials]).toEqual(["EUR", 150000, 20000000]);
});

test("decimal currency accepts cents", async ({ page }) => {
  await page.goto("/fr/simulateur");
  await page.locator("select").first().selectOption("EUR");
  await page.getByLabel("Revenu mensuel net").fill("1 500,50");
  await calc(page);
  await expect(page.getByLabel("Revenu mensuel net")).toHaveAttribute("inputmode", "decimal");
  await expect(page.getByRole("listitem").filter({ hasText: "Besoins" })).toContainText("750,25");
});

const cfa = (...ns: number[]) => ns.map((n) => formatMoney(n, "XOF", "fr"));

const seedDraft = (page: import("@playwright/test").Page, method = "50-30-20") =>
  page.addInitScript((m) => {
    if (!localStorage.getItem("sf-simulation"))
      localStorage.setItem("sf-simulation", JSON.stringify({ v: 1, income: 500000, currency: "XOF", method: m, custom: [{ name: "needs", kind: "need", pct: 100 }], essentials: null, hasDebt: null, savings: null }));
  }, method);

/** Montants affichés dans la liste de répartition, dans l'ordre. */
const amounts = (page: import("@playwright/test").Page) =>
  page.locator("section[aria-label='Répartition'] > ul > li strong").allInnerTexts();

/** Barre stable : aucun style d'animation en ligne sur les segments ni l'anneau du choix de méthode. */
const settled = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-bar] > *, [data-ring]")].every((el) => !el.style.transform && !el.style.clipPath && !el.style.filter),
  );

/** Échantillonne à chaque image les transformations en ligne des segments et les montants. */
const sample = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __frames: string[][] };
    w.__frames = [];
    const tick = () => {
      w.__frames.push([...document.querySelectorAll<HTMLElement>("[data-bar] > *")].map((el) => el.style.transform));
      requestAnimationFrame(tick);
    };
    tick();
  });
const frames = (page: import("@playwright/test").Page) => page.evaluate(() => (window as unknown as { __frames: string[][] }).__frames);

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("switching method recomposes bar and ends exact", async ({ page }) => {
    await seedDraft(page);
    await page.goto("/fr/simulateur");
    await expect.poll(() => amounts(page)).toEqual(cfa(250000, 150000, 100000));
    await expect.poll(() => settled(page)).toBe(true);
    await sample(page);
    await page.getByRole("radio", { name: /Méthode 70\/20\/10/ }).click();
    await expect.poll(() => amounts(page)).toEqual(cfa(350000, 100000, 50000));
    await expect.poll(() => settled(page)).toBe(true);
    expect((await frames(page)).some((f) => f.some((t) => t !== ""))).toBe(true); // les segments ont bougé
    // Position finale : bord gauche de chaque segment = part cumulée de la barre.
    const lefts = await page.locator("[data-bar] > *").evaluateAll((els) => {
      const bar = els[0].parentElement!.getBoundingClientRect();
      return els.map((el) => Math.round(((el.getBoundingClientRect().left - bar.left) / bar.width) * 100));
    });
    expect(lefts).toEqual([0, 70, 90]);
  });

  test("rapid switching leaves no stale state", async ({ page }) => {
    const errors: string[] = [];
    // Erreurs réseau exclues (401 attendu de /api/dashboard, conseils indisponibles) : on vise les erreurs du code.
    page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(`${e.message}
${e.stack}`));
    await seedDraft(page);
    await page.goto("/fr/simulateur");
    await expect.poll(() => settled(page)).toBe(true);
    for (const name of [/6 comptes/, /FIRE 10\/70\/20/, /Méthode 70\/20\/10/, /Méthode 80\/20/, /Méthode 50\/30\/20/])
      await page.getByRole("radio", { name }).click({ delay: 0 });
    await expect.poll(() => amounts(page)).toEqual(cfa(250000, 150000, 100000));
    await expect.poll(() => settled(page)).toBe(true);
    await expect(page.locator("[data-ring]")).toHaveCount(1);
    await expect(page.locator("label:has(input:checked) [data-ring]")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("custom editor adds and removes envelopes, total turns green", async ({ page }) => {
    await seedDraft(page, "custom");
    await page.goto("/fr/simulateur");
    const status = page.getByRole("status").filter({ hasText: "Total" });
    await expect(status).toContainText("100 %");
    await page.getByRole("button", { name: "Ajouter une enveloppe" }).click();
    await expect(page.getByLabel("Pourcentage, enveloppe 2")).toBeVisible();
    await page.getByLabel("Pourcentage, enveloppe 2").fill("10");
    await expect(status).toContainText("Retirez 10 %");
    await page.getByRole("button", { name: "Retirer l’enveloppe 2" }).click();
    await expect(page.getByLabel("Pourcentage, enveloppe 2")).toHaveCount(0);
    await expect(status).toContainText("100 %");
    await expect.poll(() => page.locator("section[aria-label='Votre répartition'] > div").evaluateAll((els) => els.every((el) => !(el as HTMLElement).style.clipPath))).toBe(true);
  });

  test("removal applies at once, even when leaving right away", async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem("sf-simulation"))
        localStorage.setItem("sf-simulation", JSON.stringify({ v: 1, income: 500000, currency: "XOF", method: "custom", custom: [{ name: "a", kind: "need", pct: 40 }, { name: "b", kind: "want", pct: 30 }, { name: "c", kind: "save", pct: 20 }, { name: "d", kind: "give", pct: 10 }], essentials: null, hasDebt: null, savings: null }));
    });
    await page.goto("/fr/simulateur");
    const names = () => page.evaluate(() => JSON.parse(localStorage.getItem("sf-simulation")!).custom.map((e: { name: string }) => e.name));
    // Deux suppressions rapides : les deux s'appliquent.
    await page.getByRole("button", { name: "Retirer l’enveloppe 4" }).click();
    await page.getByRole("button", { name: "Retirer l’enveloppe 1" }).click();
    expect(await names()).toEqual(["b", "c"]);
    await expect(page.getByLabel("Nom, enveloppe 1")).toHaveValue("b");
    // Suppression puis changement de méthode immédiat : l'enveloppe reste supprimée.
    await page.getByRole("button", { name: "Retirer l’enveloppe 2" }).click();
    await page.getByRole("radio", { name: /Méthode 50\/30\/20/ }).click();
    expect(await names()).toEqual(["b"]);
    await page.getByRole("radio", { name: /personnalisée/ }).click();
    await expect(page.getByLabel("Pourcentage, enveloppe 2")).toHaveCount(0);
    await expect(page.getByLabel("Nom, enveloppe 1")).toHaveValue("b");
    // Aucun fantôme ne reste dans la page.
    await expect.poll(() => page.locator("body > [data-env]").count()).toBe(0);
  });

  test("mobile 360 stays within the viewport while animating", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await seedDraft(page);
    await page.goto("/fr/simulateur");
    await page.evaluate(() => {
      const w = window as unknown as { __widths: number[] };
      w.__widths = [];
      const tick = () => { w.__widths.push(document.documentElement.scrollWidth); requestAnimationFrame(tick); };
      tick();
    });
    await page.getByRole("radio", { name: /6 comptes/ }).click();
    await expect.poll(() => settled(page)).toBe(true);
    const widths = await page.evaluate(() => (window as unknown as { __widths: number[] }).__widths);
    expect(Math.max(...widths)).toBeLessThanOrEqual(360);
  });
});

test("reduced motion instant", async ({ page }) => {
  await seedDraft(page);
  await page.goto("/fr/simulateur");
  await expect.poll(() => amounts(page)).toEqual(cfa(250000, 150000, 100000));
  await sample(page);
  await page.getByRole("radio", { name: /Méthode 70\/20\/10/ }).click();
  expect(await amounts(page)).toEqual(cfa(350000, 100000, 50000));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  expect((await frames(page)).every((f) => f.every((t) => t === ""))).toBe(true);
  expect(await settled(page)).toBe(true);
});
