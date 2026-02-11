import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReceivingImportLot } from "@/components/pages/ReceivingImportLot";
import { ReceivingVerification } from "@/components/pages/ReceivingVerification";
import { ReceivingGrading } from "@/components/pages/ReceivingGrading";
import { WipJobs } from "@/components/pages/WipJobs";
import { StoreProvider } from "@/context/StoreContext";

vi.mock("@/hooks/useUiActionFeedback", () => ({
  useUiActionFeedback: () => ({ trigger: vi.fn(), feedback: null }),
}));

vi.mock("@/hooks/useIdempotentAction", () => ({
  useIdempotentAction: () => ({ run: vi.fn(() => ({ message: "logged" })) }),
}));

function renderWithStore(node: ReactElement) {
  return render(<StoreProvider>{node}</StoreProvider>);
}

describe("UI action wiring", () => {
  it("commits import lot", () => {
    renderWithStore(<ReceivingImportLot />);
    fireEvent.click(screen.getByText("Next → Upload"));
    fireEvent.click(screen.getByText("Next → Map"));
    fireEvent.click(screen.getByText("Next → Preview"));

    const btn = screen.getByTestId("import-commit");
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
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

  it("opens and closes WIP details", () => {
    renderWithStore(<WipJobs />);
    fireEvent.click(screen.getByText("ALM-WIP-20240115-0001"));
    expect(screen.getByText("✓ Complete Job")).toBeInTheDocument();

    fireEvent.click(screen.getByText("✕ Close"));
    expect(screen.queryByText("✓ Complete Job")).not.toBeInTheDocument();
  });
});
