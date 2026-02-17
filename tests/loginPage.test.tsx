import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginPage } from "@/components/pages/LoginPage";
import { LAST_SESSION_SUMMARY_KEY, SESSION_HISTORY_KEY, SESSION_SUMMARY_TTL_MS } from "@/utils/sessionSummary";

vi.mock("@/utils/javaAuth", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

import { loginUser, registerUser } from "@/utils/javaAuth";

describe("LoginPage UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("shows last session completion/pending summary when available", () => {
    sessionStorage.setItem(
      LAST_SESSION_SUMMARY_KEY,
      JSON.stringify({ completedPercent: 92, pendingPercent: 8, endedAt: new Date().toISOString() })
    );

    render(<LoginPage onAuthenticated={vi.fn()} />);

    expect(screen.getByText("Last session summary")).toBeInTheDocument();
    expect(screen.getByText("Completion: 92% • Pending: 8%")).toBeInTheDocument();
    expect(screen.getByText(/Ended:/)).toBeInTheDocument();
  });

  it("hides stale session summaries older than TTL", () => {
    sessionStorage.setItem(
      LAST_SESSION_SUMMARY_KEY,
      JSON.stringify({
        completedPercent: 55,
        pendingPercent: 45,
        endedAt: new Date(Date.now() - SESSION_SUMMARY_TTL_MS - 1_000).toISOString(),
      })
    );

    render(<LoginPage onAuthenticated={vi.fn()} />);

    expect(screen.queryByText("Last session summary")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(LAST_SESSION_SUMMARY_KEY)).toBeNull();
  });

  it("dismisses last session summary and clears storage", () => {
    sessionStorage.setItem(
      LAST_SESSION_SUMMARY_KEY,
      JSON.stringify({ completedPercent: 75, pendingPercent: 25, endedAt: new Date().toISOString() })
    );

    render(<LoginPage onAuthenticated={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Last session summary")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(LAST_SESSION_SUMMARY_KEY)).toBeNull();
  });

  it("shows recent session trend and clears history", () => {
    localStorage.setItem(
      SESSION_HISTORY_KEY,
      JSON.stringify([
        { completedPercent: 90, pendingPercent: 10, endedAt: new Date().toISOString() },
        { completedPercent: 70, pendingPercent: 30, endedAt: new Date().toISOString() },
      ])
    );

    render(<LoginPage onAuthenticated={vi.fn()} />);

    expect(screen.getByText(/Recent session trend/)).toBeInTheDocument();
    expect(screen.getByText(/Avg completion: 80%/)).toBeInTheDocument();
    expect(screen.getByText(/Momentum:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear history" }));
    expect(screen.queryByText(/Recent session trend/)).not.toBeInTheDocument();
    expect(localStorage.getItem(SESSION_HISTORY_KEY)).toBeNull();
  });

  it("disables submit until required fields are complete", () => {
    render(<LoginPage onAuthenticated={vi.fn()} />);
    const submit = screen.getByRole("button", { name: "Sign In" });

    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "qa@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });

    expect(submit).not.toBeDisabled();
  });

  it("supports toggling password visibility", () => {
    render(<LoginPage onAuthenticated={vi.fn()} />);

    const password = screen.getByLabelText("Password") as HTMLInputElement;
    expect(password.type).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password.type).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password.type).toBe("password");
  });

  it("submits login on Enter", async () => {
    vi.mocked(loginUser).mockResolvedValue({ token: "t", user: { id: "1", email: "qa@example.com", fullName: "QA" } });
    const onAuthenticated = vi.fn();

    render(<LoginPage onAuthenticated={onAuthenticated} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "qa@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });

    fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({ email: "qa@example.com", password: "secret123" });
      expect(onAuthenticated).toHaveBeenCalled();
    });
  });

  it("shows register mode validation and returns to login after successful registration", async () => {
    vi.mocked(registerUser).mockResolvedValue({ id: "2", email: "new@example.com", fullName: "New User" });

    render(<LoginPage onAuthenticated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Need an account? Register" }));
    expect(screen.getByRole("heading", { name: "Register Employee" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "New User" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalled();
      expect(screen.getByText("Registration successful. You can now log in.")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Employee Login" })).toBeInTheDocument();
    });
  });
});
