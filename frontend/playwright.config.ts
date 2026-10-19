import { defineConfig } from "@playwright/test";

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const UV = process.env.UV ?? "python -m uv";

const DB = join(mkdtempSync(join(tmpdir(), "sf-e2e-")), "e2e.db").replaceAll("\\", "/");
// Lancé depuis frontend/ : le backend/.env (clé Resend réelle éventuelle) n'est jamais chargé.
const BACKEND = `${UV} run --frozen --project ../backend`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3100" },
  webServer: [
    {
      command: `${BACKEND} alembic -c ../backend/alembic.ini upgrade head && ${BACKEND} uvicorn app.main:app --port 8100`,
      env: { ENV: "development", RESEND_API_KEY: "", DATABASE_URL: `sqlite:///${DB}`, APP_URL: "http://127.0.0.1:3100" },
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
