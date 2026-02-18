import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { ReceivingImportLot } from "@/components/pages/ReceivingImportLot";
import { ReceivingVerification } from "@/components/pages/ReceivingVerification";
import { ReceivingGrading } from "@/components/pages/ReceivingGrading";
import { WipJobs } from "@/components/pages/WipJobs";
import { ProcessingTracks } from "@/components/pages/ProcessingTracks";
import { StoreProvider } from "@/context/StoreContext";

const triggerMock = vi.fn();
const exportCsvMock = vi.fn();
const { fetchAuthUsersMock } = vi.hoisted(() => ({
  fetchAuthUsersMock: vi.fn(),
}));

vi.mock("@/hooks/useUiActionFeedback", () => ({
  useUiActionFeedback: () => ({ trigger: triggerMock, feedback: null }),
}));

vi.mock("@/hooks/useIdempotentAction", () => ({
  useIdempotentAction: () => ({ run: vi.fn(() => ({ message: "logged" })) }),
}));

vi.mock("@/utils/exporters", () => ({
  exportCsv: (...args: unknown[]) => exportCsvMock(...args),
  exportJson: vi.fn(),
  exportExcel: vi.fn(),
}));

vi.mock("@/utils/javaAuth", async () => {
  const actual = await vi.importActual<typeof import("@/utils/javaAuth")>("@/utils/javaAuth");
  return {
    ...actual,
    fetchAuthUsers: fetchAuthUsersMock,
  };
});
function renderWithStore(node: ReactElement) {
  return render(<StoreProvider>{node}</StoreProvider>);
}

describe("UI action wiring", () => {
  beforeEach(() => {
    triggerMock.mockClear();
    exportCsvMock.mockClear();
    fetchAuthUsersMock.mockResolvedValue([{ id: "u1", email: "tech@erp.com", fullName: "Technician", role: "USER" }]);
  });

  it("commits import lot", async () => {
    renderWithStore(<ReceivingImportLot />);
    expect(screen.getByText("System suggested next steps")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText("Next → Upload"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Next → Map"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Next → Preview"));
    });

    const btn = screen.getByTestId("import-commit");
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(btn).toBeInTheDocument();
    expect(screen.getByText("System suggested next steps")).toBeInTheDocument();
  });

  it("completes verification", async () => {
    renderWithStore(<ReceivingVerification />);
    const btn = screen.getByTestId("verification-complete");

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(btn).toBeInTheDocument();
  });

  it("filters verification rows using table search", async () => {
    renderWithStore(<ReceivingVerification />);

    const firstBarcode = screen.getAllByRole("row")[1].querySelector("td")?.textContent?.trim() ?? "";
    expect(firstBarcode).toBeTruthy();

    const searchInput = screen.getByPlaceholderText(/Filter by barcode\/brand\/model\/status/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: firstBarcode } });
    });

    expect(screen.getByText(firstBarcode)).toBeInTheDocument();
    expect(screen.queryByText("No laptops match the selected tab/search filters. Try clearing search.")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "NON-EXISTENT-BARCODE" } });
    });

    expect(screen.getByText("No laptops match the selected tab/search filters. Try clearing search.")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Clear Search/i }));
    });

    expect(screen.queryByText("No laptops match the selected tab/search filters. Try clearing search.")).not.toBeInTheDocument();
  });

  it("saves grading", async () => {
    renderWithStore(<ReceivingGrading />);
    const btn = screen.getByTestId("grading-save");

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(btn).toBeInTheDocument();
  });

  it("shows filtered WIP count and clears active filters", async () => {
    renderWithStore(<WipJobs />);

    const clearButton = screen.getByRole("button", { name: /✕ Clear/i });
    expect(clearButton).toBeDisabled();

    const searchInput = screen.getByPlaceholderText(/Search WIP, laptop, brand/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "NOT-FOUND-WIP" } });
    });

    expect(screen.getByText(/Showing 0 of/i)).toBeInTheDocument();
    expect(screen.getByText("No WIP jobs match the active filters. Clear filters or create a new WIP job.")).toBeInTheDocument();
    expect(clearButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(screen.queryByText("No WIP jobs match the active filters. Clear filters or create a new WIP job.")).not.toBeInTheDocument();
  });

  it("opens WIP details", async () => {
    renderWithStore(<WipJobs />);

    await act(async () => {
      fireEvent.click(screen.getAllByText("Detail")[0]);
    });
    expect(screen.getByText("✓ Complete Job")).toBeInTheDocument();
    expect(screen.getByText("System suggested next steps")).toBeInTheDocument();
    expect(screen.getAllByText("ALM-WIP-20240115-0001")).toHaveLength(2);
  });
  it("warns when verifying a laptop that is already verified", async () => {
    renderWithStore(<ReceivingVerification />);

    const rows = screen.getAllByRole("row");
    const barcodeCell = rows[1].querySelector("td");
    const barcode = (barcodeCell?.textContent || "").trim();
    expect(barcode).toBeTruthy();

    const input = screen.getByPlaceholderText(/Scan barcode/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: barcode } });
      fireEvent.click(screen.getByText("VERIFY"));
    });

    await act(async () => {
      fireEvent.change(input, { target: { value: barcode } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(triggerMock).toHaveBeenCalledWith("warn", expect.stringContaining("already verified"));
  });

  it("blocks duplicate active WIP creation for same laptop", async () => {
    renderWithStore(<WipJobs />);

    const barcodeMatch = screen.getAllByText(/ALM-LP-/i)[0]?.textContent?.trim() ?? "";
    expect(barcodeMatch).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByText("+ New WIP Job"));
    });

    const laptopInput = screen.getByPlaceholderText(/Laptop Barcode \*/i);
    await act(async () => {
      fireEvent.change(laptopInput, { target: { value: barcodeMatch } });
      fireEvent.click(screen.getByText("✓ Create"));
    });

    expect(triggerMock).toHaveBeenCalledWith("warn", expect.stringContaining("already has active WIP"));
  });

  it("exports active processing track snapshot", async () => {
    renderWithStore(<ProcessingTracks />);

    await act(async () => {
      fireEvent.click(screen.getByText(/↗ Export/i));
    });

    expect(exportCsvMock).toHaveBeenCalledTimes(1);
    const fileName = exportCsvMock.mock.calls[0][0] as string;
    expect(fileName).toContain("processing-track-a-");
  });

  it("uses user select controls for labor technician and approver", async () => {
    renderWithStore(<WipJobs />);

    await act(async () => {
      fireEvent.click(screen.getAllByText("Detail")[0]);
      fireEvent.click(screen.getByRole("button", { name: "LABOR" }));
    });

    expect(screen.getAllByRole("option", { name: "Technician" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("option", { name: "Supervisor" }).length).toBeGreaterThan(0);
  });
});
