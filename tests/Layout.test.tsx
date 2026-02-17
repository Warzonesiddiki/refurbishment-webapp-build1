import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Layout } from "@/components/Layout";
import { LAST_SESSION_SUMMARY_KEY, SESSION_HISTORY_KEY } from "@/utils/sessionSummary";

vi.mock("@/context/StoreContext", () => ({
  useStore: () => ({
    state: {
      laptops: [],
      wipJobs: [],
      alerts: [],
    },
    dispatch: vi.fn(),
  }),
}));

vi.mock("@/utils/projectCompletion", () => ({
  evaluateProjectCompletion: () => ({ overallPercent: 83 }),
}));

describe("Layout session progress", () => {
  const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: matchMediaMock,
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });
  it("shows completed/pending percentage in sidebar system section", () => {
    render(
      <Layout activePage="dashboard" onNavigate={vi.fn()} theme="pro">
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText("Session Progress")).toBeInTheDocument();
    expect(screen.getByText("83% / 17%")).toBeInTheDocument();
  });

  it("shows completion and pending percentages when logging out", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const logoutSpy = vi.fn();

    render(
      <Layout activePage="dashboard" onNavigate={vi.fn()} theme="pro" onLogout={logoutSpy}>
        <div>Content</div>
      </Layout>
    );

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("Completion: 83%"));
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("Pending: 17%"));
    expect(logoutSpy).toHaveBeenCalledTimes(1);

    const rawSummary = sessionStorage.getItem(LAST_SESSION_SUMMARY_KEY);
    expect(rawSummary).toBeTruthy();
    const summary = JSON.parse(rawSummary || "{}");
    expect(summary.completedPercent).toBe(83);
    expect(summary.pendingPercent).toBe(17);

    const rawHistory = localStorage.getItem(SESSION_HISTORY_KEY);
    expect(rawHistory).toBeTruthy();
    const history = JSON.parse(rawHistory || "[]");
    expect(history).toHaveLength(1);
    expect(history[0].completedPercent).toBe(83);
  });
});
