import { test, expect } from "../fixtures/base";

test("should navigate to finance cash from sidebar", async ({ app }) => {
  await app.goto("/");
  await app.rawPage.getByRole("button", { name: /finance/i }).first().click();
  await app.rawPage.getByRole("button", { name: /cash/i }).first().click();
  await expect(app.rawPage.getByRole("heading", { level: 1 })).toContainText(/finance cash/i);
});
