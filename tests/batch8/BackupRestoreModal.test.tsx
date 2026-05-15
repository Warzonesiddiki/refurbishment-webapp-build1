import type { ReactNode } from "react";
import type { RestoreOptions } from "@/store/types/RestoreTypes";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackupRestoreModal } from "@/components/Backup/BackupRestoreModal";
import { createInitialState } from "@/store/appState";

const createFullBackupMock = vi.fn();
const downloadBackupMock = vi.fn();
const validateBackupFileMock = vi.fn();

vi.mock("@/components/ui/Modal", () => ({
  Modal: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) =>
    open ? (
      <div>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/Backup/BackupProgress", () => ({
  BackupProgress: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock("@/components/Backup/RestorePreview", () => ({
  RestorePreview: ({ onConfirm }: { onConfirm: (options: RestoreOptions) => void }) => (
    <button
      onClick={() =>
        onConfirm({
          modules: ["INVENTORY"],
          conflictResolution: "ASK",
          preserveSequences: false,
          dryRun: false,
          createRollbackPoint: true,
        })
      }
    >
      Confirm Restore
    </button>
  ),
}));

vi.mock("@/utils/backup/createBackup", () => ({
  createFullBackup: (...args: unknown[]) => createFullBackupMock(...args),
  downloadBackup: (...args: unknown[]) => downloadBackupMock(...args),
}));

vi.mock("@/utils/backup/validateBackup", () => ({
  validateBackupFile: (...args: unknown[]) => validateBackupFileMock(...args),
}));

describe("BackupRestoreModal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    createFullBackupMock.mockReset();
    downloadBackupMock.mockReset();
    validateBackupFileMock.mockReset();
  });

  it("shows operation error when export fails", async () => {
    createFullBackupMock.mockRejectedValue(new Error("boom"));

    render(
      <BackupRestoreModal
        open
        mode="EXPORT"
        state={createInitialState()}
        onClose={() => undefined}
        onRestore={() => undefined}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /generate and download/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to create backup/i)).toBeInTheDocument();
    });
    expect(downloadBackupMock).not.toHaveBeenCalled();
  });

  it("shows operation error when import processing throws", async () => {
    validateBackupFileMock.mockRejectedValue(new Error("import failed"));

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "input") {
        const input = element as HTMLInputElement;
        const originalClick = input.click.bind(input);
        input.click = () => {
          if (input.type === "file") {
            Object.defineProperty(input, "files", {
              configurable: true,
              get: () => [new File(["{}"], "b.json", { type: "application/json" })],
            });
            if (typeof input.onchange === "function") {
              void input.onchange(new Event("change") as unknown as Event & { target: HTMLInputElement });
              return;
            }
          }
          originalClick();
        };
      }
      return element;
    });

    render(
      <BackupRestoreModal
        open
        mode="IMPORT"
        state={createInitialState()}
        onClose={() => undefined}
        onRestore={() => undefined}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /select backup file/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to import backup/i)).toBeInTheDocument();
    });
  });

  it("resets transient modal state when closed and reopened", async () => {
    createFullBackupMock.mockRejectedValue(new Error("boom"));

    const { rerender } = render(
      <BackupRestoreModal
        open
        mode="EXPORT"
        state={createInitialState()}
        onClose={() => undefined}
        onRestore={() => undefined}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /generate and download/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to create backup/i)).toBeInTheDocument();
    });

    rerender(
      <BackupRestoreModal
        open={false}
        mode="EXPORT"
        state={createInitialState()}
        onClose={() => undefined}
        onRestore={() => undefined}
      />
    );

    rerender(
      <BackupRestoreModal
        open
        mode="EXPORT"
        state={createInitialState()}
        onClose={() => undefined}
        onRestore={() => undefined}
      />
    );

    expect(screen.queryByText(/unable to create backup/i)).not.toBeInTheDocument();
  });


  it("forwards restore options from preview confirm", async () => {
    validateBackupFileMock.mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      backup: {
        version: 5,
        appVersion: "0.0.0",
        backupId: "id-restore",
        backupType: "FULL",
        parentBackupId: null,
        exportedAt: new Date().toISOString(),
        exportedBy: null,
        checksum: "abc",
        encrypted: false,
        encryptionMethod: null,
        iv: null,
        salt: null,
        compression: "none",
        metadata: {
          deviceInfo: { userAgent: "ua", platform: "p", language: "en", screenResolution: "1x1", timezone: "UTC" },
          recordCounts: {},
          dateRange: { earliest: new Date().toISOString(), latest: new Date().toISOString() },
          modules: ["INVENTORY"],
          size: 1,
          incrementalSince: null,
        },
        data: { inventory: { laptops: [], parts: [], movements: [] } },
      },
      compatibility: {
        backupVersion: 5,
        currentVersion: 5,
        compatible: true,
        requiresMigration: false,
        migrationPath: [],
        warnings: [],
        errors: [],
      },
      preview: {
        modules: ["INVENTORY"],
        totalChanges: { additions: 1, updates: 0, deletions: 0, conflicts: 0 },
        conflicts: [],
        sequenceUpdates: {},
        estimatedDuration: 1,
      },
    });

    const onRestore = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "input") {
        const input = element as HTMLInputElement;
        input.click = () => {
          if (input.type === "file") {
            Object.defineProperty(input, "files", {
              configurable: true,
              get: () => [new File(["{}"], "b.json", { type: "application/json" })],
            });
            if (typeof input.onchange === "function") {
              void input.onchange(new Event("change") as unknown as Event & { target: HTMLInputElement });
            }
          }
        };
      }
      return element;
    });

    render(<BackupRestoreModal open mode="IMPORT" state={createInitialState()} onClose={() => undefined} onRestore={onRestore} />);

    await userEvent.click(screen.getByRole("button", { name: /select backup file/i }));
    await screen.findByRole("button", { name: /confirm restore/i });
    await userEvent.click(screen.getByRole("button", { name: /confirm restore/i }));

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore.mock.calls[0][1]).toMatchObject({
      modules: ["INVENTORY"],
      conflictResolution: "ASK",
      preserveSequences: false,
      dryRun: false,
      createRollbackPoint: true,
    });
  });


  it("shows validation warnings returned by backup validation", async () => {
    validateBackupFileMock.mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [{ code: "OLD_BACKUP", message: "Backup older than 30 days", severity: "medium" }],
      backup: {
        version: 5,
        appVersion: "0.0.0",
        backupId: "id-warn",
        backupType: "FULL",
        parentBackupId: null,
        exportedAt: new Date().toISOString(),
        exportedBy: null,
        checksum: "abc",
        encrypted: false,
        encryptionMethod: null,
        iv: null,
        salt: null,
        compression: "none",
        metadata: {
          deviceInfo: { userAgent: "ua", platform: "p", language: "en", screenResolution: "1x1", timezone: "UTC" },
          recordCounts: {},
          dateRange: { earliest: new Date().toISOString(), latest: new Date().toISOString() },
          modules: ["INVENTORY"],
          size: 1,
          incrementalSince: null,
        },
        data: { inventory: { laptops: [], parts: [], movements: [] } },
      },
      compatibility: {
        backupVersion: 5,
        currentVersion: 5,
        compatible: true,
        requiresMigration: false,
        migrationPath: [],
        warnings: [],
        errors: [],
      },
      preview: {
        modules: ["INVENTORY"],
        totalChanges: { additions: 0, updates: 0, deletions: 0, conflicts: 0 },
        conflicts: [],
        sequenceUpdates: {},
        estimatedDuration: 1,
      },
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "input") {
        const input = element as HTMLInputElement;
        input.click = () => {
          if (input.type === "file") {
            Object.defineProperty(input, "files", {
              configurable: true,
              get: () => [new File(["{}"], "b.json", { type: "application/json" })],
            });
            if (typeof input.onchange === "function") {
              void input.onchange(new Event("change") as unknown as Event & { target: HTMLInputElement });
            }
          }
        };
      }
      return element;
    });

    render(<BackupRestoreModal open mode="IMPORT" state={createInitialState()} onClose={() => undefined} onRestore={() => undefined} />);

    await userEvent.click(screen.getByRole("button", { name: /select backup file/i }));

    await waitFor(() => {
      expect(screen.getByText(/\[MEDIUM\] backup older than 30 days/i)).toBeInTheDocument();
    });
  });


  it("clears warnings after modal close and reopen", async () => {
    validateBackupFileMock.mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [{ code: "OLD_BACKUP", message: "Backup older than 30 days", severity: "medium" }],
      backup: {
        version: 5,
        appVersion: "0.0.0",
        backupId: "id-warn-2",
        backupType: "FULL",
        parentBackupId: null,
        exportedAt: new Date().toISOString(),
        exportedBy: null,
        checksum: "abc",
        encrypted: false,
        encryptionMethod: null,
        iv: null,
        salt: null,
        compression: "none",
        metadata: {
          deviceInfo: { userAgent: "ua", platform: "p", language: "en", screenResolution: "1x1", timezone: "UTC" },
          recordCounts: {},
          dateRange: { earliest: new Date().toISOString(), latest: new Date().toISOString() },
          modules: ["INVENTORY"],
          size: 1,
          incrementalSince: null,
        },
        data: { inventory: { laptops: [], parts: [], movements: [] } },
      },
      compatibility: {
        backupVersion: 5,
        currentVersion: 5,
        compatible: true,
        requiresMigration: false,
        migrationPath: [],
        warnings: [],
        errors: [],
      },
      preview: {
        modules: ["INVENTORY"],
        totalChanges: { additions: 0, updates: 0, deletions: 0, conflicts: 0 },
        conflicts: [],
        sequenceUpdates: {},
        estimatedDuration: 1,
      },
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "input") {
        const input = element as HTMLInputElement;
        input.click = () => {
          if (input.type === "file") {
            Object.defineProperty(input, "files", {
              configurable: true,
              get: () => [new File(["{}"], "b.json", { type: "application/json" })],
            });
            if (typeof input.onchange === "function") {
              void input.onchange(new Event("change") as unknown as Event & { target: HTMLInputElement });
            }
          }
        };
      }
      return element;
    });

    const { rerender } = render(<BackupRestoreModal open mode="IMPORT" state={createInitialState()} onClose={() => undefined} onRestore={() => undefined} />);

    await userEvent.click(screen.getByRole("button", { name: /select backup file/i }));
    await waitFor(() => {
      expect(screen.getByText(/\[MEDIUM\] backup older than 30 days/i)).toBeInTheDocument();
    });

    rerender(<BackupRestoreModal open={false} mode="IMPORT" state={createInitialState()} onClose={() => undefined} onRestore={() => undefined} />);
    rerender(<BackupRestoreModal open mode="IMPORT" state={createInitialState()} onClose={() => undefined} onRestore={() => undefined} />);

    expect(screen.queryByText(/\[MEDIUM\] backup older than 30 days/i)).not.toBeInTheDocument();
  });


  it("deduplicates identical validation warnings", async () => {
    validateBackupFileMock.mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [
        { code: "OLD_BACKUP", message: "Backup older than 30 days", severity: "medium" },
        { code: "OLD_BACKUP", message: "Backup older than 30 days", severity: "medium" },
      ],
      backup: {
        version: 5,
        appVersion: "0.0.0",
        backupId: "id-dup-warn",
        backupType: "FULL",
        parentBackupId: null,
        exportedAt: new Date().toISOString(),
        exportedBy: null,
        checksum: "abc",
        encrypted: false,
        encryptionMethod: null,
        iv: null,
        salt: null,
        compression: "none",
        metadata: {
          deviceInfo: { userAgent: "ua", platform: "p", language: "en", screenResolution: "1x1", timezone: "UTC" },
          recordCounts: {},
          dateRange: { earliest: new Date().toISOString(), latest: new Date().toISOString() },
          modules: ["INVENTORY"],
          size: 1,
          incrementalSince: null,
        },
        data: { inventory: { laptops: [], parts: [], movements: [] } },
      },
      compatibility: {
        backupVersion: 5,
        currentVersion: 5,
        compatible: true,
        requiresMigration: false,
        migrationPath: [],
        warnings: [],
        errors: [],
      },
      preview: {
        modules: ["INVENTORY"],
        totalChanges: { additions: 0, updates: 0, deletions: 0, conflicts: 0 },
        conflicts: [],
        sequenceUpdates: {},
        estimatedDuration: 1,
      },
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "input") {
        const input = element as HTMLInputElement;
        input.click = () => {
          if (input.type === "file") {
            Object.defineProperty(input, "files", {
              configurable: true,
              get: () => [new File(["{}"], "b.json", { type: "application/json" })],
            });
            if (typeof input.onchange === "function") {
              void input.onchange(new Event("change") as unknown as Event & { target: HTMLInputElement });
            }
          }
        };
      }
      return element;
    });

    render(<BackupRestoreModal open mode="IMPORT" state={createInitialState()} onClose={() => undefined} onRestore={() => undefined} />);

    await userEvent.click(screen.getByRole("button", { name: /select backup file/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/\[MEDIUM\] backup older than 30 days/i)).toHaveLength(1);
    });
  });

});
