import { expect, type Page } from "@playwright/test";

export async function expectVisualSnapshot(page: Page, name: string) {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    threshold: 0.1,
    maxDiffPixelRatio: 0.01,
  });
}
