import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: false,
    exclude: ["e2e/**", "node_modules/**", "dist/**"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json"],
      reportsDirectory: "coverage",
      exclude: ["**/*.test.{ts,tsx}", "**/tests/**", "e2e/**", "**/*.d.ts", "**/index.ts", "src/main.tsx"],
      thresholds: {
        // Ratcheted to current stable baseline; increase progressively as coverage debt is reduced.
        statements: 65,
        branches: 50,
        functions: 60,
        lines: 70,
      },
    },
  },
});
