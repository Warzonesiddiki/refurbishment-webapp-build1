import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Input, Select, Textarea } from "@/components/ui/Form";

describe("Form components", () => {
  it("Input renders and shows error", () => {
    render(<Input name="n" label="Name" error="Required" touched required />);
    expect(screen.getByText("Name *", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("Select handles change", () => {
    render(<Select name="s" label="Status" options={[{ value: "a", label: "A" }]} />);
    fireEvent.change(screen.getByLabelText(/Status/i), { target: { value: "a" } });
    expect((screen.getByLabelText(/Status/i) as HTMLSelectElement).value).toBe("a");
  });

  it("Textarea respects maxLength", () => {
    render(<Textarea name="t" label="Text" value="abc" maxLength={5} showCount onChange={() => {}} />);
    expect(screen.getByText("3/5")).toBeInTheDocument();
  });
});
