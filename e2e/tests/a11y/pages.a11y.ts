import { test } from "../../fixtures/base";
import { expectNoA11yViolations } from "../../utils/a11yTestUtils";

for (const pagePath of ["/", "/"]) {
  test(`@a11y page ${pagePath} has no critical/serious violations`, async ({ app }) => {
    await app.goto(pagePath);
    await expectNoA11yViolations(app.rawPage);
  });
}
