import { BasePage } from "./BasePage";
export class SalesPage extends BasePage { async open() { await this.page.keyboard.press("Control+S"); } }
