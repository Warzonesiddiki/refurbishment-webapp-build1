import { test, expect } from "../fixtures/base";

test.describe("Inventory Management", () => {
  test("should open inventory laptops via shortcut", async ({ app }) => {
    await app.goto("/");
    await app.pressShortcut("Control+Shift+L");
    await expect.soft(app.rawPage.getByRole("heading", { level: 1 })).toContainText(/inventory laptops/i);
  });

  test("should open inventory parts via shortcut", async ({ app }) => {
    await app.goto("/");
    await app.pressShortcut("Control+Shift+P");
    await expect.soft(app.rawPage.getByRole("heading", { level: 1 })).toContainText(/inventory parts/i);
  });
});
