import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StoreProvider } from "@/context/StoreContext";
import { ReportsPage } from "@/components/pages/ReportsPage";

vi.mock("@/hooks/useUiActionFeedback", () => ({
  useUiActionFeedback: () => ({ trigger: vi.fn(), feedback: null }),
}));

vi.mock("@/hooks/useIdempotentAction", () => ({
  useIdempotentAction: () => ({ run: vi.fn(() => ({ message: "logged" })) }),
}));

describe("ReportsPage completion readiness panel", () => {
  it("renders completion readiness summary and forecast", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    expect(screen.getByText("PROJECT COMPLETION READINESS")).toBeInTheDocument();
    expect(screen.getByText("TARGET 95%")).toBeInTheDocument();
    expect(screen.getByText("Forecast to 95%")).toBeInTheDocument();
  });


  it("shows aged balance summaries in payables and receivables tabs", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Payables Overview/i }));
    });
    expect(screen.getByText("Aged Payables (days overdue)")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Receivables Overview/i }));
    });
    expect(screen.getByText("Aged Receivables (days overdue)")).toBeInTheDocument();
  });



  it("shows cash flow statement section in reports", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Cash Flow Statement/i }));
    });

    expect(screen.getByText("Direct Method")).toBeInTheDocument();
    expect(screen.getByText("Indirect Method")).toBeInTheDocument();
  });

});
