import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SelectableTable } from "@/components/ui/SelectableTable";

describe("Bulk actions", () => {
  it("selection bar appears and executes action", async () => {
    const action = vi.fn().mockResolvedValue({ success: 1, failed: 0 });
    render(
      <SelectableTable
        data={[{ id: "1", name: "A" }]}
        selectedIds={new Set(["1"])}
        onSelectionChange={() => {}}
        bulkActions={[{ id: "a", label: "Do", onExecute: action }]}
        renderRow={(r) => <span>{r.name}</span>}
      />
    );
    expect(screen.getByText("1/1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Do"));
    expect(action).toHaveBeenCalled();
  });
});
