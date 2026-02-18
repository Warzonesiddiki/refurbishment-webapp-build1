import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreProvider } from "@/context/StoreContext";
import { SettingsPage } from "@/components/pages/SettingsPage";

const { fetchCurrentUserMock } = vi.hoisted(() => ({
  fetchCurrentUserMock: vi.fn(),
}));

vi.mock("@/utils/javaAuth", async () => {
  const actual = await vi.importActual<typeof import("@/utils/javaAuth")>("@/utils/javaAuth");
  return {
    ...actual,
    fetchCurrentUser: fetchCurrentUserMock,
  };
});

describe("Settings diagnostics section", () => {
  beforeEach(() => {
    fetchCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "user@erp.com",
      fullName: "Regular User",
      role: "USER",
    });
  });
  it("renders runtime diagnostics widgets", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <SettingsPage />
        </StoreProvider>,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Diagnostics/i }));
    });

    expect(screen.getByText(/DIAGNOSTICS & REPAIR TOOLS/i)).toBeInTheDocument();
    expect(screen.getByText(/RUNTIME EVENT LOG/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear Runtime Events/i)).toBeInTheDocument();
  });

  it("disables seeded-password reset action for non-admin users", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <SettingsPage />
        </StoreProvider>,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Diagnostics/i }));
    });

    expect(screen.getByRole("button", { name: /Admin Only/i })).toBeDisabled();
  });

  it("enables seeded-password reset action for admin users", async () => {
    fetchCurrentUserMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@erp.com",
      fullName: "Admin User",
      role: "ADMIN",
    });

    await act(async () => {
      render(
        <StoreProvider>
          <SettingsPage />
        </StoreProvider>,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Diagnostics/i }));
    });

    expect(screen.queryByRole("button", { name: /Admin Only/i })).not.toBeInTheDocument();
  });

  it("requires explicit RESET confirmation before destructive reset", async () => {
    await act(async () => {
      render(
        <StoreProvider>
          <SettingsPage />
        </StoreProvider>,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Danger Zone/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Reset$/i }));
    });

    const confirmButton = screen.getByRole("button", { name: /Confirm Reset/i });
    expect(confirmButton).toBeDisabled();

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Type "RESET"'), { target: { value: "RESET" } });
    });

    expect(confirmButton).not.toBeDisabled();
  });
});
