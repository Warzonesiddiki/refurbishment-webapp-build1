import { test } from "../../fixtures/base";
import { expectVisualSnapshot } from "../../utils/visualTestUtils";

test("@visual reports", async ({ app }) => {
  await app.goto("/");
  await app.pressShortcut("Control+Shift+R");
  await expectVisualSnapshot(app.rawPage, "reports");
});
