import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginPage } from "@/components/pages/LoginPage";

vi.mock("@/utils/javaAuth", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

import { loginUser, registerUser } from "@/utils/javaAuth";

describe("LoginPage UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
