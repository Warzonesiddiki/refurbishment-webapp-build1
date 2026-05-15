import type { Page } from "@playwright/test";
export class CommandPalette { constructor(private readonly page: Page) {} async open(){ await this.page.keyboard.press('Control+K'); } }
