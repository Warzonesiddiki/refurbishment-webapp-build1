import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude(".dev-tools")
    .analyze();

  const criticalOrSerious = results.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));
  expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toHaveLength(0);
}
