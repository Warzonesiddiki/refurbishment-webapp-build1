import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoreProvider } from "@/context/StoreContext";
import { SettingsPage } from "@/components/pages/SettingsPage";

describe("Settings diagnostics section", () => {
  it("renders runtime diagnostics widgets", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <SettingsPage />
        </StoreProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Diagnostics/i }));
    });

    expect(screen.getByText(/DIAGNOSTICS & REPAIR TOOLS/i)).toBeInTheDocument();
    expect(screen.getByText(/RUNTIME EVENT LOG/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear Runtime Events/i)).toBeInTheDocument();
  });
});
