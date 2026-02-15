import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { OfflineReplayAuditPanel } from "@/components/mobile/OfflineReplayAuditPanel";
import { appendOfflineReplayAudit, clearOfflineReplayAudit } from "@/utils/offlineReplayAudit";

describe("OfflineReplayAuditPanel", () => {
  beforeEach(() => {
    clearOfflineReplayAudit();
  });

  it("is hidden when no audit records", () => {
    render(<OfflineReplayAuditPanel theme="pro" />);
    expect(screen.queryByText(/replay audit/i)).toBeNull();
  });

  it("shows count and supports clear", () => {
    appendOfflineReplayAudit({ type: "WIP_ADD_PART", summary: "Queued add part" }, "replayed");
    render(<OfflineReplayAuditPanel theme="cyber" />);
    expect(screen.getByText(/replay audit: 1/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.queryByText(/replay audit:/i)).toBeNull();
  });
});
