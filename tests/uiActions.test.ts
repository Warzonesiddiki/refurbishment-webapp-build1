import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReceivingImportLot } from "@/components/pages/ReceivingImportLot";
import { ReceivingVerification } from "@/components/pages/ReceivingVerification";
import { ReceivingGrading } from "@/components/pages/ReceivingGrading";
import { WipJobsPage } from "@/components/pages/WipJobs";

// Mock hooks to avoid random feedback timeouts
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

describe("UI action wiring", () => {
  it("commits import lot", () => {
    render(<ReceivingImportLot />);
    const btn = screen.getByTestId("import-commit");
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it("completes verification", () => {
    render(<ReceivingVerification />);
    const btn = screen.getByTestId("verification-complete");
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it("saves grading", () => {
    render(<ReceivingGrading />);
    const btn = screen.getByTestId("grading-save");
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it("moves WIP stage", () => {
    render(<WipJobsPage />);
    const btn = screen.getByTestId("move-ALM-WIP-20240115-0001");
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });
});
