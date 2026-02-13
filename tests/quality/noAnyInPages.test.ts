import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PAGES_DIR = path.resolve(__dirname, "../../src/components/pages");
const TS_PATTERN = /\.(ts|tsx)$/;
const BANNED_ANY_PATTERN = /\sas any\b|<any>|:\s*any\b/;

function collectFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return TS_PATTERN.test(entry.name) ? [fullPath] : [];
  });
}

describe("page-level type safety guardrails", () => {
  it("does not allow new explicit any casts/annotations in src/components/pages", () => {
    const files = collectFiles(PAGES_DIR);
    const offenders = files.filter((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      return BANNED_ANY_PATTERN.test(source);
    });

    expect(offenders, `Found explicit any usage in: ${offenders.join(", ")}`).toEqual([]);
  });
});
