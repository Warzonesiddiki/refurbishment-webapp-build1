import { describe, expect, it } from "vitest";
import { joinJavaApiPath, resolveJavaApiBase } from "@/utils/javaApiBase";

describe("javaApiBase", () => {
  it("deduplicates /api when base is /api", () => {
    expect(joinJavaApiPath("/api", "/api/auth/login")).toBe("/api/auth/login");
  });

  it("deduplicates /api when base is full URL ending with /api", () => {
    expect(joinJavaApiPath("http://localhost:8085/api", "/api/health")).toBe("http://localhost:8085/api/health");
  });

  it("joins normal URL base and path", () => {
    expect(joinJavaApiPath("http://localhost:8085", "/api/health")).toBe("http://localhost:8085/api/health");
  });

  it("trims trailing slash from configured base", () => {
    expect(resolveJavaApiBase("http://localhost:8085/")).toBe("http://localhost:8085");
  });
});
