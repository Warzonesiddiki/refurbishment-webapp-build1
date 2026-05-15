import { BasePage } from "./BasePage";
export class ReportsPage extends BasePage { async open() { await this.page.keyboard.press("Control+Shift+R"); } }
