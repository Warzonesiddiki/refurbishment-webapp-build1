import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ActionCommandPalette } from "@/components/ui/ActionCommandPalette";

describe("ActionCommandPalette", () => {
  it("runs quick backup action", () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    const onAction = vi.fn();

    render(<ActionCommandPalette open onClose={onClose} onNavigate={onNavigate} onAction={onAction} recentPages={["dashboard"]} />);

    fireEvent.click(screen.getByText(/Create Backup/i));
    expect(onAction).toHaveBeenCalledWith("backup");
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates to recent page chip", () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    const onAction = vi.fn();

    render(<ActionCommandPalette open onClose={onClose} onNavigate={onNavigate} onAction={onAction} recentPages={["reports"]} />);

    fireEvent.click(screen.getAllByText("reports")[0]);
    expect(onNavigate).toHaveBeenCalledWith("reports");
    expect(onClose).toHaveBeenCalled();
  });
});
