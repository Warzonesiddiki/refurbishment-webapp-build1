import { BasePage } from "./BasePage";
export class PartsPage extends BasePage { async open() { await this.page.keyboard.press("Control+Shift+P"); } }
