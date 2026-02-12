import { test as base } from "@playwright/test";
import { AppFixture } from "./app";
import { DbFixture } from "./db";

export const test = base.extend<{ app: AppFixture; db: DbFixture }>({
  page: async ({ page }, use) => {
    await page.route("**/api/auth/me", async (route) => {
      const auth = route.request().headerValue("authorization");
      if (auth) {
        await route.fulfill({ status: 200, body: JSON.stringify({ id: "e2e", email: "e2e@test.local", fullName: "E2E User" }) });
      } else {
        await route.fulfill({ status: 401, body: "Unauthorized" });
      }
    });
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ token: "e2e-token", user: { id: "e2e", email: "e2e@test.local", fullName: "E2E User" } }) });
    });
    await page.route("**/api/auth/register", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ id: "e2e", email: "e2e@test.local", fullName: "E2E User" }) });
    });
    await page.addInitScript(() => localStorage.setItem("alm_auth_token", "e2e-token"));
    await use(page);
  },
  app: async ({ page }, use) => use(new AppFixture(page)),
  db: async ({ page }, use) => use(new DbFixture(page)),
});

export const expect = test.expect;
