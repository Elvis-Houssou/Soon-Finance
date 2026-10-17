import { defineConfig } from "@playwright/test";

const UV = process.env.UV ?? "python -m uv";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3100" },
  webServer: [
    {
      command: `${UV} run --project ../api uvicorn soonfinance.main:app --port 8000`,
      url: "http://127.0.0.1:8000/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run build && npm run start -- -p 3100",
      url: "http://127.0.0.1:3100/fr",
      env: { API_ORIGIN: "http://127.0.0.1:8000" },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
