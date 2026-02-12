import { test } from "../../fixtures/base";
import { expectVisualSnapshot } from "../../utils/visualTestUtils";

test("@visual sales", async ({ app }) => {
  await app.goto("/");
  await app.pressShortcut("Control+S");
  await expectVisualSnapshot(app.rawPage, "sales");
});
