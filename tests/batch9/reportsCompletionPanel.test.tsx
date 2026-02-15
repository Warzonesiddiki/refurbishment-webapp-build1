import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StoreProvider } from "@/context/StoreContext";
import { ReportsPage } from "@/components/pages/ReportsPage";

const exportCsvMock = vi.fn();

vi.mock("@/hooks/useUiActionFeedback", () => ({
  useUiActionFeedback: () => ({ trigger: vi.fn(), feedback: null }),
}));

vi.mock("@/hooks/useIdempotentAction", () => ({
  useIdempotentAction: () => ({ run: vi.fn(() => ({ message: "logged" })) }),
}));

vi.mock("@/utils/exporters", () => ({
  exportCsv: (...args: unknown[]) => exportCsvMock(...args),
  exportJson: vi.fn(),
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




  it("opens accounting drilldown with sales filter from receivable KPI", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Receivable Due/i }));
    });

    expect(screen.getByText(/Journal drill-down/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sales$/i })).toHaveAttribute("aria-pressed", "true");
  });



  it("opens accounting drilldown with purchases filter from payable KPI", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Payable Due/i }));
    });

    expect(screen.getByText(/Journal drill-down/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Purchases$/i })).toHaveAttribute("aria-pressed", "true");
  });
  it("resets drilldown scope when leaving accounting reports", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Receivable Due/i }));
    });

    expect(screen.getByRole("button", { name: /^Sales$/i })).toHaveAttribute("aria-pressed", "true");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Inventory Valuation/i }));
      fireEvent.click(screen.getByRole("button", { name: /Accounting Statements/i }));
    });

    expect(screen.getByRole("button", { name: /All entries/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("exports scoped accounting journal rows", async () => {
    exportCsvMock.mockClear();

    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Receivable Due/i }));
    });

    const exportButton = await screen.findByRole("button", { name: /Export journal CSV/i });

    await act(async () => {
      fireEvent.click(exportButton);
    });

    expect(exportCsvMock).toHaveBeenCalledTimes(1);
    const rows = exportCsvMock.mock.calls[0][1] as string[][];
    expect(rows[0]).toEqual(["Date", "Source", "Reference", "Counterparty", "Amount"]);
    expect(rows.length).toBeGreaterThanOrEqual(1);
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
