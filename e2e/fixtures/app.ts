import type { Locator, Page } from "@playwright/test";
import { clearAllStorage, extractState, injectState, waitForStateSettled } from "../utils/testHelpers";

export class AppFixture {
  constructor(private readonly page: Page) {}

  get rawPage() {
    return this.page;
  }

  async goto(path = "/") {
    await this.page.goto(path);
    await this.waitForLoaded();
  }

  getByTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }

  async waitForLoaded() {
    await this.page.getByRole("heading", { level: 1 }).first().waitFor();
    await waitForStateSettled(this.page);
  }

  async clearState() {
    await clearAllStorage(this.page);
  }

  async seedState(state: Record<string, unknown>) {
    await injectState(this.page, state);
  }

  async getState<T>() {
    return extractState<T>(this.page);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
  }

  async expectToast(message: string) {
    await this.page.getByText(message).first().waitFor();
  }

  async closeModal() {
    await this.page.keyboard.press("Escape");
  }

  async pressShortcut(shortcut: string) {
    await this.page.keyboard.press(shortcut);
  }
}
