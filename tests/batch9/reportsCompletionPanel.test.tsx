import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StoreProvider } from "@/context/StoreContext";
import { ReportsPage } from "@/components/pages/ReportsPage";

const exportCsvMock = vi.fn();
const exportJsonMock = vi.fn();
const exportExcelMock = vi.fn();

vi.mock("@/hooks/useUiActionFeedback", () => ({
  useUiActionFeedback: () => ({ trigger: vi.fn(), feedback: null }),
}));

vi.mock("@/hooks/useIdempotentAction", () => ({
  useIdempotentAction: () => ({ run: vi.fn(() => ({ message: "logged" })) }),
}));

vi.mock("@/utils/exporters", () => ({
  exportCsv: (...args: unknown[]) => exportCsvMock(...args),
  exportJson: (...args: unknown[]) => exportJsonMock(...args),
  exportExcel: (...args: unknown[]) => exportExcelMock(...args),
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



  it("supports daily and monthly report period toggles", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    const dailyButton = screen.getByRole("button", { name: /^Daily$/i });
    const monthlyButton = screen.getByRole("button", { name: /^Monthly$/i });

    expect(dailyButton).toHaveAttribute("aria-pressed", "true");
    expect(monthlyButton).toHaveAttribute("aria-pressed", "false");

    await act(async () => {
      fireEvent.click(monthlyButton);
    });

    expect(monthlyButton).toHaveAttribute("aria-pressed", "true");
    expect(dailyButton).toHaveAttribute("aria-pressed", "false");
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
    const fileName = exportCsvMock.mock.calls[0][0] as string;
    const rows = exportCsvMock.mock.calls[0][1] as string[][];
    expect(fileName).toContain("report-accounting-journal-sales-all-time-");
    expect(rows[0]).toEqual(["Date", "Source", "Reference", "Counterparty", "Amount"]);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it("exports scoped accounting journal as json for selected window", async () => {
    exportJsonMock.mockClear();

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

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Last 30 days/i }));
    });

    const exportJsonButton = await screen.findByRole("button", { name: /Export journal JSON/i });

    await act(async () => {
      fireEvent.click(exportJsonButton);
    });

    expect(exportJsonMock).toHaveBeenCalledTimes(1);
    const jsonFileName = exportJsonMock.mock.calls[0][0] as string;
    expect(jsonFileName).toContain("report-accounting-journal-sales-last-30-days-");
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

  it("shows VAT exception diagnostics in tax report", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Taxation Summary/i }));
    });

    expect(screen.getByText("VAT Exception Report")).toBeInTheDocument();
    expect(screen.getByText(/Issues:/i)).toBeInTheDocument();
  });

  it("exports VAT filing evidence package from tax report", async () => {
    exportJsonMock.mockClear();

    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Taxation Summary/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Export VAT Filing Evidence/i }));
    });

    await waitFor(() => {
      expect(exportJsonMock).toHaveBeenCalledTimes(1);
    });
    const fileName = exportJsonMock.mock.calls[0][0] as string;
    const payload = exportJsonMock.mock.calls[0][1] as { integrity?: { checksum?: string } };
    expect(fileName).toContain("vat-filing-evidence-");
    expect(payload.integrity?.checksum).toBeTruthy();
  });

  it("exports VAT period-lock evidence template from tax report", async () => {
    exportJsonMock.mockClear();

    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Taxation Summary/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Export VAT Period-Lock Template/i }));
    });

    await waitFor(() => {
      expect(exportJsonMock).toHaveBeenCalledTimes(1);
    });

    const fileName = exportJsonMock.mock.calls[0][0] as string;
    const payload = exportJsonMock.mock.calls[0][1] as {
      sections?: Array<{ id: string }>;
      snapshot?: { issueCount: number; boxCount: number } | null;
    };
    expect(fileName).toContain("vat-period-lock-template-");
    expect(payload.sections?.some((section) => section.id === "vat-box-mapping-review")).toBe(true);
    expect(payload.snapshot?.boxCount).toBeGreaterThan(0);
    expect(typeof payload.snapshot?.issueCount).toBe("number");
  });

  it("exports VAT submission payload from tax report", async () => {
    exportJsonMock.mockClear();

    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Taxation Summary/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Export VAT Submission Payload/i }));
    });

    await waitFor(() => {
      expect(exportJsonMock).toHaveBeenCalledTimes(1);
    });

    const fileName = exportJsonMock.mock.calls[0][0] as string;
    const payload = exportJsonMock.mock.calls[0][1] as {
      authority?: string;
      acknowledgement?: { status?: string };
      integrity?: { checksum?: string };
    };
    expect(fileName).toContain("vat-submission-uae-fzta-");
    expect(payload.authority).toBe("uae-fzta");
    expect(payload.acknowledgement?.status).toBe("pending");
    expect(payload.integrity?.checksum).toBeTruthy();
  });

  it("exports VAT reconciliation snapshot from tax report", async () => {
    exportJsonMock.mockClear();

    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Taxation Summary/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Export VAT Reconciliation Snapshot/i }));
    });

    await waitFor(() => {
      expect(exportJsonMock).toHaveBeenCalledTimes(1);
    });

    const fileName = exportJsonMock.mock.calls[0][0] as string;
    const payload = exportJsonMock.mock.calls[0][1] as {
      summary?: { total: number; matched: number };
      latestAcknowledgedEnvelope?: { acknowledgement?: { status?: string } } | null;
    };

    expect(fileName).toContain("vat-ack-reconciliation-");
    expect(payload.summary?.total).toBe(1);
    expect(payload.summary?.matched).toBe(1);
    expect(payload.latestAcknowledgedEnvelope?.acknowledgement?.status).toBe("acknowledged");
  });

  it("shows VAT box mapping detail in tax report", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Taxation Summary/i }));
    });

    expect(screen.getByText("VAT Box Mapping Detail")).toBeInTheDocument();
    expect(screen.getByText(/box\(es\)/i)).toBeInTheDocument();
  });
  it("exports report summary to excel and opens print dialog", async () => {
    exportExcelMock.mockClear();
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    await act(async () => {
      render(
        <StoreProvider>
          <ReportsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Excel$/i }));
    });

    expect(exportExcelMock).toHaveBeenCalledTimes(1);
    const fileName = exportExcelMock.mock.calls[0][0] as string;
    const rows = exportExcelMock.mock.calls[0][1] as string[][];
    expect(fileName).toContain("report-inventory-");
    expect(rows[0]).toEqual(["Report", "inventory"]);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Print$/i }));
    });

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });


});
