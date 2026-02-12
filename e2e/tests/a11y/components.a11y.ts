import { test } from "../../fixtures/base";
import { expectNoA11yViolations } from "../../utils/a11yTestUtils";

test("@a11y command palette", async ({ app }) => {
  await app.goto("/");
  await app.pressShortcut("Control+K");
  await expectNoA11yViolations(app.rawPage);
});
