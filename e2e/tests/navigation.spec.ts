import { test, expect } from "../fixtures/base";

test("should open command palette", async ({ app, page }) => {
  await app.goto("/");
  await app.pressShortcut("Control+K");
  await expect(page.getByRole("dialog")).toBeVisible();
});
