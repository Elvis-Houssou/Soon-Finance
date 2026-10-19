import { defineConfig } from "@playwright/test";

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const UV = process.env.UV ?? "python -m uv";

const BACKEND_DIR = resolve(__dirname, "../backend").replaceAll("\\", "/");
// cwd = dossier temporaire sans .env : aucun backend/.env (clé Resend réelle) ne peut être chargé,
// car env_ignore_empty empêche RESEND_API_KEY="" de l'écraser.
const E2E_DIR = mkdtempSync(join(tmpdir(), "sf-e2e-")).replaceAll("\\", "/");
const BACKEND = `${UV} run --frozen --project "${BACKEND_DIR}"`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Mouvement réduit par défaut : tests déterministes ; les tests d'animation passent en "no-preference".
  use: { baseURL: "http://127.0.0.1:3100", reducedMotion: "reduce" },
  webServer: [
    {
      command: `${BACKEND} alembic -c "${BACKEND_DIR}/alembic.ini" upgrade head && ${BACKEND} uvicorn app.main:app --port 8100`,
      cwd: E2E_DIR,
      env: { ENV: "development", RESEND_API_KEY: "", DATABASE_URL: `sqlite:///${E2E_DIR}/e2e.db`, APP_URL: "http://127.0.0.1:3100", LOGIN_LIMIT_PER_IP: "1000", ADMIN_EMAILS: "Admin.E2E@exemple.com" },
      url: "http://127.0.0.1:8100/api/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run build && npm run start -- -p 3100",
      url: "http://127.0.0.1:3100/fr",
      env: { API_ORIGIN: "http://127.0.0.1:8100" },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
