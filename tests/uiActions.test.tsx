import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
  it("commits import lot", async () => {
    renderWithStore(<ReceivingImportLot />);
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
  });

  it("completes verification", async () => {
    renderWithStore(<ReceivingVerification />);
    const btn = screen.getByTestId("verification-complete");

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(btn).toBeInTheDocument();
  });

  it("saves grading", async () => {
    renderWithStore(<ReceivingGrading />);
    const btn = screen.getByTestId("grading-save");

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(btn).toBeInTheDocument();
  });

  it("opens and closes WIP details", async () => {
    renderWithStore(<WipJobs />);

    await act(async () => {
      fireEvent.click(screen.getByText("ALM-WIP-20240115-0001"));
    });
    expect(screen.getByText("✓ Complete Job")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("✕ Close"));
    });
    expect(screen.queryByText("✓ Complete Job")).not.toBeInTheDocument();
  });
});
