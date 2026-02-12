import { test } from "../../fixtures/base";
import { expectVisualSnapshot } from "../../utils/visualTestUtils";

test("@visual finance", async ({ app }) => {
  await app.goto("/");
  await app.rawPage.getByRole("button", { name: /finance/i }).first().click();
  await app.rawPage.getByRole("button", { name: /cash/i }).first().click();
  await expectVisualSnapshot(app.rawPage, "finance");
});
