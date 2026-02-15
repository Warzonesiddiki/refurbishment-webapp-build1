import { describe, expect, it, vi } from "vitest";
import {
  canInstallPwa,
  getIosInstallSteps,
  IOS_INSTALL_STEPS,
  isAndroidDevice,
  isIOSDevice,
  shouldShowInstallPrompt,
  shouldShowIosInstallHint,
} from "@/utils/pwa";

describe("pwa utils", () => {
  it("detects android user agents", () => {
    expect(isAndroidDevice("Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit")).toBe(true);
    expect(isAndroidDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(false);
  });

  it("exports static iOS install steps constant", () => {
    expect(IOS_INSTALL_STEPS.length).toBe(3);
  });

  it("supports iOS hint detection", () => {
    expect(isIOSDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(shouldShowIosInstallHint("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(getIosInstallSteps().length).toBeGreaterThan(0);
    expect(canInstallPwa("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", false)).toBe(true);
  });

  it("shows install prompt only for android + deferred prompt + non-standalone", () => {
    const original = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    expect(shouldShowInstallPrompt("Mozilla/5.0 (Linux; Android 14)", true)).toBe(true);
    expect(shouldShowInstallPrompt("Mozilla/5.0 (Linux; Android 14)", false)).toBe(false);
    expect(shouldShowInstallPrompt("Mozilla/5.0 (iPhone)", true)).toBe(false);
    expect(canInstallPwa("Mozilla/5.0 (Linux; Android 14)", true)).toBe(true);

    Object.defineProperty(window, "matchMedia", { writable: true, value: original });
  });
});
