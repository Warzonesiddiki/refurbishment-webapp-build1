import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BackupSettings } from "@/components/Backup/BackupSettings";
import { PartialRestoreSelector } from "@/components/Backup/PartialRestoreSelector";

describe("backup components", () => {
  it("renders settings and selector", () => {
    render(
      <BackupSettings
        settings={{ autoReminder: true, reminderThreshold: 100, reminderInterval: 7, includeAuditInBackup: false, defaultEncryption: false, compressionEnabled: false, snoozeUntil: null }}
        history={[]}
        rollbackPoints={[]}
        onSettingsChange={() => undefined}
        onFullBackup={() => undefined}
        onIncrementalBackup={() => undefined}
        onRollback={() => undefined}
        onDeleteRollback={() => undefined}
      />
    );
    expect(screen.getByText(/BACKUP SETTINGS/)).toBeInTheDocument();

    render(<PartialRestoreSelector available={["SALES", "INVENTORY", "MASTER_DATA"]} selected={[]} onChange={() => undefined} />);
    expect(screen.getByText(/SALES/)).toBeInTheDocument();
  });
});
