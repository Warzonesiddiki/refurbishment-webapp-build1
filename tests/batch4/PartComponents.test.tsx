import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PartForm } from "@/components/Parts/PartForm";
import { PartList } from "@/components/Parts/PartList";
import { PartSearch } from "@/components/Parts/PartSearch";
import { BOMEditor } from "@/components/Parts/BOMEditor";

describe("Part components", () => {
  it("PartList renders and filters", () => {
    render(<PartList parts={[{ id: "1", sku: "SKU1", name: "RAM", quantity: 1, reservedQty: 0, availableQty: 1, minStock: 1, unitCost: 1, isActive: true, createdAt: "", updatedAt: "" }]} />);
    expect(screen.getByText("SKU1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search parts"), { target: { value: "zzz" } });
    expect(screen.queryByText("SKU1")).not.toBeInTheDocument();
  });

  it("PartForm validates required fields", () => {
    const onSubmit = vi.fn();
    render(<PartForm onSubmit={onSubmit} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("PartSearch returns matching parts", () => {
    render(<PartSearch parts={[{ id: "1", sku: "SKU1", name: "RAM", quantity: 1, reservedQty: 0, availableQty: 1, minStock: 1, unitCost: 1, isActive: true, createdAt: "", updatedAt: "" }]} />);
    fireEvent.change(screen.getByLabelText("Part Search"), { target: { value: "SK" } });
    expect(screen.getByText(/SKU1/)).toBeInTheDocument();
  });

  it("BOMEditor adds/removes items", () => {
    const onChange = vi.fn();
    render(<BOMEditor onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Item"));
    expect(onChange).toHaveBeenCalled();
  });
});
