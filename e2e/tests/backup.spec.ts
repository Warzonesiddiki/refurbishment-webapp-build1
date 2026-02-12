import { test, expect } from "../fixtures/base";

test("should trigger backup via keyboard shortcut", async ({ app, page }) => {
  await app.goto("/");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    app.pressShortcut("Control+B"),
  ]);
  expect(download.suggestedFilename()).toContain("almasfufa-backup-");
});
