import { describe, expect, it } from "vitest";
import { decryptBackup, encryptBackup, validatePassword } from "@/utils/backup/encryption";

describe("encryption", () => {
  it("encrypt/decrypt roundtrip", async () => {
    const e = await encryptBackup("hello", "strongpass1");
    const d = await decryptBackup(e, "strongpass1");
    expect(d).toBe("hello");
    expect(await validatePassword(e, "strongpass1")).toBe(true);
  });

  it("wrong password throws", async () => {
    const e = await encryptBackup("hello", "strongpass1");
    await expect(decryptBackup(e, "wrongpass")).rejects.toThrow();
  });
});
