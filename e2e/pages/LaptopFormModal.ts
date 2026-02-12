import type { Page } from "@playwright/test";
export class LaptopFormModal { constructor(private readonly page: Page) {} async cancel() { await this.page.keyboard.press("Escape"); } }
