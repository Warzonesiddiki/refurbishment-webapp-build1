import type { Page } from "@playwright/test";

export class BasePage {
  constructor(protected readonly page: Page, protected readonly path = "/") {}

  async goto() {
    await this.page.goto(this.path);
  }

  async waitForLoad() {
    await this.page.getByRole("heading", { level: 1 }).first().waitFor();
  }

  async getTitle() {
    return this.page.title();
  }

  async getUrl() {
    return this.page.url();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
  }
}
