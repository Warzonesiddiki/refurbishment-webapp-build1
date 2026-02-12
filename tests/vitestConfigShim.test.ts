// @vitest-environment node
import { describe, expect, it } from "vitest";
import rootConfig from "../vitest.config";
import shimConfig from "./vitest.config";

describe("vitest config shim", () => {
  it("re-exports the root config object", () => {
    expect(shimConfig).toBe(rootConfig);
  });

  it("preserves expected test environment settings", () => {
    expect(shimConfig.test?.environment).toBe("jsdom");
    expect(shimConfig.test?.setupFiles).toEqual(["./tests/setup.ts"]);
  });
});
