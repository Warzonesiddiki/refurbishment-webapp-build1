import { test } from "../../fixtures/base";
import { expectVisualSnapshot } from "../../utils/visualTestUtils";

test("@visual command palette modal", async ({ app }) => {
  await app.goto("/");
  await app.pressShortcut("Control+K");
  await expectVisualSnapshot(app.rawPage, "command-palette");
});
