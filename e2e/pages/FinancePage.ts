import { BasePage } from "./BasePage";
export class FinancePage extends BasePage { async openCash() { await this.page.getByRole("button", { name: /finance/i }).first().click({trial:false}).catch(()=>{}); } }
