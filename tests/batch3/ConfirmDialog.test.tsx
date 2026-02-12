import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("calls handlers", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="T" message="M" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Confirm"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });
});
