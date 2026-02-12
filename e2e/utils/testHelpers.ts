import type { Page } from "@playwright/test";

export async function waitForNetworkIdle(page: Page, timeout = 1500): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: Math.max(timeout, 1000) });
}

export async function waitForStateSettled(page: Page): Promise<void> {
  await page.waitForTimeout(100);
  await waitForNetworkIdle(page, 1000);
}

export async function clearAllStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if ("indexedDB" in window && indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all(dbs.map((db) => db.name && indexedDB.deleteDatabase(db.name)));
    }
  });
}

export async function mockDate(page: Page, date: Date): Promise<void> {
  await page.addInitScript((iso) => {
    const fixed = new Date(iso).valueOf();
    Date.now = () => fixed;
  }, date.toISOString());
}

export async function injectState<T extends object>(page: Page, state: Partial<T>): Promise<void> {
  await page.evaluate((nextState) => {
    const key = "almasfufa:app-state";
    const existing = localStorage.getItem(key);
    const parsed = existing ? JSON.parse(existing) : { version: 3, timestamp: Date.now(), data: {} };
    parsed.data = { ...(parsed.data ?? {}), ...nextState };
    parsed.timestamp = Date.now();
    localStorage.setItem(key, JSON.stringify(parsed));
  }, state);
}

export async function extractState<T>(page: Page): Promise<T | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("almasfufa:app-state");
    if (!raw) return null;
    return JSON.parse(raw).data;
  });
}

export function generateTestFile(content: string, filename: string): { name: string; mimeType: string; buffer: Buffer } {
  return { name: filename, mimeType: "application/json", buffer: Buffer.from(content) };
}
