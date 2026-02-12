import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InlineEdit } from "@/components/ui/InlineEdit";

describe("InlineEdit", () => {
  it("enters edit and saves on enter", () => {
    const onSave = vi.fn();
    render(<InlineEdit value="x" onSave={onSave} />);
    fireEvent.click(screen.getByText("x"));
    const input = screen.getByDisplayValue("x");
    fireEvent.change(input, { target: { value: "y" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith("y");
  });
});
