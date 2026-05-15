import { BasePage } from "./BasePage";
export class InventoryPage extends BasePage {
  async open() { await this.page.keyboard.press("Control+Shift+L"); }
}
