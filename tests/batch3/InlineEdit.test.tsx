import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { InlineEdit } from "@/components/ui/InlineEdit";

describe("InlineEdit", () => {
  it("enters edit and saves on enter", async () => {
    const onSave = vi.fn();
    render(<InlineEdit value="x" onSave={onSave} />);

    await act(async () => {
      fireEvent.click(screen.getByText("x"));
    });

    const input = screen.getByDisplayValue("x");
    await act(async () => {
      fireEvent.change(input, { target: { value: "y" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(onSave).toHaveBeenCalledWith("y");
  });
});
