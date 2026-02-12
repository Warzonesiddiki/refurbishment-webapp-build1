import { test } from "../../fixtures/base";
import { expectVisualSnapshot } from "../../utils/visualTestUtils";

test("@visual dashboard", async ({ app }) => {
  await app.goto("/");
  await expectVisualSnapshot(app.rawPage, "dashboard");
});
