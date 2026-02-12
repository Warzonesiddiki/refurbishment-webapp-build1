import { test, expect } from "../../fixtures/base";

test("@a11y keyboard navigation works for skip link", async ({ app }) => {
  await app.goto("/");
  await app.rawPage.keyboard.press("Tab");
  await expect(app.rawPage.getByRole("link", { name: /skip to content/i })).toBeFocused();
});
