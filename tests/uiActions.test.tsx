import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReceivingImportLot } from "@/components/pages/ReceivingImportLot";
import { ReceivingVerification } from "@/components/pages/ReceivingVerification";
import { ReceivingGrading } from "@/components/pages/ReceivingGrading";
import { WipJobs } from "@/components/pages/WipJobs";
import { StoreProvider } from "@/context/StoreContext";

vi.mock("@/hooks/useUiActionFeedback", () => {
  return {
    useUiActionFeedback: () => ({ trigger: vi.fn(), feedback: null }),
  };
});

vi.mock("@/hooks/useIdempotentAction", () => {
  return {
    useIdempotentAction: () => ({ run: vi.fn(() => ({ message: "logged" })) }),
  };
});

function renderWithStore(ui: React.ReactElement) {
  return render(<StoreProvider>{ui}</StoreProvider>);
}

describe("UI action wiring", () => {
  it("commits import lot", () => {
    renderWithStore(<ReceivingImportLot />);
    const btn = screen.getByText("Next → Upload");
    fireEvent.click(btn);
    expect(screen.getByText("Next → Map")).toBeInTheDocument();
  });

  it("completes verification", () => {
    renderWithStore(<ReceivingVerification />);
    const btn = screen.getByTestId("verification-complete");
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it("saves grading", () => {
    renderWithStore(<ReceivingGrading />);
    const btn = screen.getByTestId("grading-save");
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it("opens WIP detail panel", () => {
    renderWithStore(<WipJobs />);
    const detailButton = screen.getAllByText("Detail")[0];
    fireEvent.click(detailButton);
    expect(screen.getByText("DIAGNOSIS")).toBeInTheDocument();
  });
});
