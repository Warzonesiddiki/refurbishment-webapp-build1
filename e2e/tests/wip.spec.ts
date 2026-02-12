import { test, expect } from "../fixtures/base";

test("should navigate to wip jobs via shortcut", async ({ app }) => {
  await app.goto("/");
  await app.pressShortcut("Control+Shift+W");
  await expect(app.rawPage.getByRole("heading", { level: 1 })).toContainText(/processing wip/i);
});
