import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast/ToastContext";
import { ToastContainer } from "@/components/Toast/ToastContainer";
import { useToast } from "@/components/Toast/useToast";
import { FocusTrap } from "@/components/ui/FocusTrap";
import { SkeletonRow } from "@/components/ui/Skeleton";

vi.useFakeTimers();

function Bomb() {
  throw new Error("boom");
}

function ToastPusher() {
  const { toast } = useToast();
  return (
    <button onClick={() => toast("success", "Saved")}>Push</button>
  );
}

describe("UI polish primitives", () => {
  it("ErrorBoundary catches and displays fallback", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("Toast stacking and auto-dismiss", () => {
    render(
      <ToastProvider>
        <ToastPusher />
        <ToastContainer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Push"));
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("Focus trap cycles correctly", () => {
    render(
      <FocusTrap active>
        <div>
          <button>First</button>
          <button>Second</button>
        </div>
      </FocusTrap>
    );

    const first = screen.getByText("First");
    const second = screen.getByText("Second");
    first.focus();
    fireEvent.keyDown(second, { key: "Tab" });
    expect(first).toHaveFocus();
  });

  it("Skeleton renders with correct animation class", () => {
    render(<SkeletonRow />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
