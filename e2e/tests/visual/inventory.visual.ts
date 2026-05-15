import { test } from "../../fixtures/base";
import { expectVisualSnapshot } from "../../utils/visualTestUtils";

test("@visual inventory", async ({ app }) => {
  await app.goto("/");
  await app.pressShortcut("Control+Shift+L");
  await expectVisualSnapshot(app.rawPage, "inventory");
});
