import { BasePage } from "./BasePage";
export class DashboardPage extends BasePage {
  constructor(page: import("@playwright/test").Page) { super(page, "/"); }
  async navigateToModule(shortcut: string) { await this.page.keyboard.press(shortcut); }
}
