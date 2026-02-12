import { test, expect } from "../fixtures/base";

test("should open new sale flow", async ({ app }) => {
  await app.goto("/");
  await app.pressShortcut("Control+S");
  await expect(app.rawPage.getByRole("heading", { level: 1 })).toContainText(/sales new/i);
});
