import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuditLogViewer } from "@/components/Audit/AuditLogViewer";
import { EntityHistory } from "@/components/Audit/EntityHistory";
import { IntegrityDashboard } from "@/components/Audit/IntegrityDashboard";

describe("audit components", () => {
  it("renders log viewer and integrity dashboard", () => {
    render(<AuditLogViewer logs={[]} />);
    expect(screen.getByText("Audit Log Viewer")).toBeInTheDocument();

    render(<IntegrityDashboard report={null} />);
    expect(screen.getByText("Integrity Dashboard")).toBeInTheDocument();
  });

  it("renders entity history", () => {
    render(<EntityHistory entityType="SALE" entityId="1" snapshots={[]} />);
    expect(screen.getByText(/Entity History/)).toBeInTheDocument();
  });
});
