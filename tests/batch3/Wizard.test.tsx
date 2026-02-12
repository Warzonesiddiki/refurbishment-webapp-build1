import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Wizard } from "@/components/ui/Wizard";

const Step = () => <div>StepBody</div>;

describe("Wizard", () => {
  it("advances and completes", async () => {
    const onComplete = vi.fn();
    render(<Wizard steps={[{ id: "1", title: "A", component: Step }, { id: "2", title: "B", component: Step }]} onComplete={onComplete} onCancel={() => {}} />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(await screen.findByText("Finish"));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });
});
