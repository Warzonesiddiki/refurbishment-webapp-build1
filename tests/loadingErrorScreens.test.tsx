import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorScreen } from "@/components/pages/LoadingErrorScreens";

describe("ErrorScreen", () => {
  it("reload button calls provided reload handler", () => {
    const onReload = vi.fn();

    render(<ErrorScreen onReload={onReload} />);
    fireEvent.click(screen.getByText("Reload"));

    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
