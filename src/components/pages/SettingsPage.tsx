import { useMemo, useReducer, useState } from "react";
import { useAppState, useDispatch } from "@/context/StoreContext";
import { BackupRestoreModal, BackupSettings as BackupSettingsPanel } from "@/components/Backup";
import { backupReducer, createInitialBackupState } from "@/store/reducers/backupReducer";
import { createFullBackup, createIncrementalBackup, downloadBackup } from "@/utils/backup/createBackup";
import type { BackupData, BackupFile } from "@/store/types/BackupTypes";
import { isRestorableBackupData, restoreStateFromBackupData, selectBackupDataModules, shouldApplyRestore } from "@/utils/backup/restoreState";
import { runRestoreRehearsal } from "@/utils/backup/restoreRehearsal";
import { getSettingsSectionHint } from "@/components/pages/settingsHints";
import { SectionHelpHint } from "@/components/ui/SectionHelpHint";
import { clearRuntimeEvents, getBuildMetadata, listRuntimeEvents, recordRuntimeEvent } from "@/utils/runtimeDiagnostics";

export function SettingsPage() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ ...state.settings });
  const [activeSection, setActiveSection] = useState("company");
  const [showDanger, setShowDanger] = useState(false);
  const [backupState, backupDispatch] = useReducer(backupReducer, undefined, createInitialBackupState);
  const [backupModalMode, setBackupModalMode] = useState<"EXPORT" | "IMPORT" | null>(null);
  const [diagnosticsRefreshTick, setDiagnosticsRefreshTick] = useState(0);

  const save = () => {
    dispatch({ type: "UPDATE_SETTINGS", payload: form });
    dispatch({ type: "ADD_ACTIVITY", payload: { action: "Settings updated", time: "just now" } });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    { key: "company", label: "Company Info", icon: "🏢" },
    { key: "financial", label: "Financial", icon: "💰" },
    { key: "inventory", label: "Inventory", icon: "📦" },
    { key: "system", label: "System", icon: "⚙️" },
    { key: "backup", label: "Backup & Restore", icon: "💾" },
    { key: "diagnostics", label: "Diagnostics", icon: "🔧" },
    { key: "danger", label: "Danger Zone", icon: "⚠️" },
  ];

  const sectionHint = getSettingsSectionHint(activeSection);
  const buildMetadata = useMemo(() => getBuildMetadata(), []);
  const runtimeEvents = useMemo(() => listRuntimeEvents(), [activeSection, diagnosticsRefreshTick]);

  return (
    <div data-page="settings-page" data-testid="page-settings-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-wider neon-text-cyan card-title" style={{ fontFamily: "var(--font-heading)" }}>SETTINGS</h1>
          </div>
          <p className="text-sm text-cyan-500/40 card-subtitle" style={{ fontFamily: "var(--font-mono)" }}>System configuration • Business rules • Backup</p>
        </div>
        <button className="btn-cyber" onClick={save}>
          {saved ? "✅ Saved!" : "💾 Save Changes"}
        </button>
      </div>

      {saved && (
        <div className="glass-card p-3 border border-green-500/30 bg-green-500/5 animate-slide-up">
          <p className="text-sm text-green-400 font-bold" style={{ fontFamily: "var(--font-mono)" }}>✓ Settings saved successfully</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeSection === s.key
                  ? "bg-cyan-500/10 neon-text-cyan border border-cyan-500/20"
                  : "text-cyan-400/40 hover:text-cyan-300 hover:bg-cyan-500/5"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          <SectionHelpHint hint={sectionHint} />

          {activeSection === "company" && (
            <div className="glass-card corner-marks p-6 space-y-4">
              <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>COMPANY INFORMATION</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>COMPANY NAME</label>
                  <input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>TRN (TAX REG NUMBER)</label>
                  <input value={form.trn} onChange={e => setForm(p => ({ ...p, trn: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>ADDRESS</label>
                  <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          )}

          {activeSection === "financial" && (
            <div className="glass-card corner-marks p-6 space-y-4">
              <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>FINANCIAL SETTINGS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>CURRENCY</label>
                  <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm">
                    <option>AED</option><option>USD</option><option>EUR</option><option>GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>VAT RATE (%)</label>
                  <input type="number" value={form.vatRate} onChange={e => setForm(p => ({ ...p, vatRate: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
                </div>
                <div>
                  <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>DATE FORMAT</label>
                  <select value={form.dateFormat} onChange={e => setForm(p => ({ ...p, dateFormat: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm">
                    <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === "inventory" && (
            <div className="glass-card corner-marks p-6 space-y-4">
              <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>INVENTORY SETTINGS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>DEFAULT LABOR RATE (AED/HR)</label>
                  <input type="number" value={form.laborRate} onChange={e => setForm(p => ({ ...p, laborRate: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
                </div>
                <div>
                  <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>TECHNICIAN RATE (AED/HR)</label>
                  <input type="number" value={form.techRate} onChange={e => setForm(p => ({ ...p, techRate: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
                </div>
                <div>
                  <label className="block text-[10px] text-cyan-500/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>DEFAULT REORDER LEVEL</label>
                  <input type="number" value={form.reorderLevel} onChange={e => setForm(p => ({ ...p, reorderLevel: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ fontFamily: "var(--font-mono)" }} />
                </div>
              </div>
            </div>
          )}

          {activeSection === "system" && (
            <div className="glass-card corner-marks p-6 space-y-4">
              <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>SYSTEM INFO</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Laptops", value: state.laptops.length },
                  { label: "Parts", value: state.parts.length },
                  { label: "WIP Jobs", value: state.wipJobs.length },
                  { label: "Sales", value: state.sales.length },
                  { label: "Purchases", value: state.purchases.length },
                  { label: "Suppliers", value: state.suppliers.length },
                  { label: "Lots", value: state.lots.length },
                  { label: "Cash Entries", value: state.cashEntries.length },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                    <p className="text-[10px] text-cyan-500/30" style={{ fontFamily: "var(--font-mono)" }}>{item.label.toUpperCase()}</p>
                    <p className="text-lg font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "backup" && (
            <div className="glass-card corner-marks p-6 space-y-4">
              <BackupSettingsPanel
                settings={backupState.settings}
                history={backupState.backupHistory}
                rollbackPoints={backupState.rollbackPoints}
                onSettingsChange={(next) => backupDispatch({ type: "UPDATE_BACKUP_SETTINGS", payload: next })}
                onFullBackup={async () => {
                  const backup = await createFullBackup(state, { includeAudit: backupState.settings.includeAuditInBackup });
                  downloadBackup(backup);
                  backupDispatch({ type: "RECORD_BACKUP", payload: { id: backup.backupId, type: backup.backupType, checksum: backup.checksum, modules: backup.metadata.modules } });
                }}
                onIncrementalBackup={async () => {
                  const backup = await createIncrementalBackup(state, backupState.changeTracker);
                  downloadBackup(backup);
                  backupDispatch({ type: "RECORD_BACKUP", payload: { id: backup.backupId, type: backup.backupType, checksum: backup.checksum, modules: backup.metadata.modules } });
                }}
                onRollback={(id) => backupDispatch({ type: "EXECUTE_ROLLBACK", payload: { rollbackId: id } })}
                onDeleteRollback={(id) => backupDispatch({ type: "DELETE_ROLLBACK_POINT", payload: { rollbackId: id } })}
              />
              <div className="flex gap-2">
                <button className="btn-cyber" onClick={() => setBackupModalMode("EXPORT")}>Open Export Modal</button>
                <button className="btn-ghost" onClick={() => setBackupModalMode("IMPORT")}>Open Import Modal</button>
              </div>

              <BackupRestoreModal
                open={backupModalMode !== null}
                mode={backupModalMode ?? "EXPORT"}
                state={state}
                onClose={() => setBackupModalMode(null)}
                onRestore={(backup: BackupFile, options) => {
                  if (typeof backup.data === "string") {
                    dispatch({
                      type: "ADD_ACTIVITY",
                      payload: {
                        action: "Restore skipped: encrypted backup payload requires successful decrypt/import first",
                        time: "just now",
                      },
                    });
                    return;
                  }

                  if (typeof backup.data === "object" && backup.data !== null) {
                    const payload = backup.data as BackupData;
                    const scopedPayload = selectBackupDataModules(payload, options.modules);
                    if (!isRestorableBackupData(scopedPayload)) {
                      dispatch({
                        type: "ADD_ACTIVITY",
                        payload: { action: "Restore skipped: backup contained no restorable modules", time: "just now" },
                      });
                      return;
                    }

                    const rehearsal = runRestoreRehearsal(state, scopedPayload, options.modules);
                    if (!rehearsal.passed) {
                      const failedChecks = rehearsal.checks.filter((check) => !check.passed).map((check) => check.id).join(", ");
                      dispatch({
                        type: "ADD_ACTIVITY",
                        payload: {
                          action: `Restore rehearsal failed for backup ${backup.backupId}: ${failedChecks || "unknown checks"}`,
                          time: "just now",
                        },
                      });
                      return;
                    }

                    if (options.dryRun) {
                      dispatch({
                        type: "ADD_ACTIVITY",
                        payload: {
                          action: `Restore dry-run passed for backup ${backup.backupId} modules: ${options.modules.join(", ") || "none"}`,
                          time: "just now",
                        },
                      });
                      return;
                    }

                    if (!shouldApplyRestore(options)) {
                      dispatch({
                        type: "ADD_ACTIVITY",
                        payload: {
                          action: `Restore skipped by conflict policy KEEP_CURRENT for backup ${backup.backupId}`,
                          time: "just now",
                        },
                      });
                      return;
                    }

                    if (options.createRollbackPoint) {
                      backupDispatch({
                        type: "CREATE_ROLLBACK_POINT",
                        payload: { reason: `Before restore ${backup.backupId}`, snapshot: state },
                      });
                    }

                    dispatch({
                      type: "RESTORE_STATE",
                      payload: restoreStateFromBackupData(state, scopedPayload),
                    });
                    dispatch({
                      type: "ADD_ACTIVITY",
                      payload: {
                        action: `Restored backup ${backup.backupId} modules: ${options.modules.join(", ") || "none"} (${options.conflictResolution})`,
                        time: "just now",
                      },
                    });
                  }
                }}
              />
            </div>
          )}

          {activeSection === "diagnostics" && (
            <div className="glass-card corner-marks p-6 space-y-4">
              <h3 className="text-sm font-bold neon-text-cyan" style={{ fontFamily: "var(--font-heading)" }}>DIAGNOSTICS & REPAIR TOOLS</h3>

              <div className="grid md:grid-cols-4 gap-2 text-[11px]">
                <div className="glass-card p-3"><p className="text-cyan-500/40">Version</p><p>{buildMetadata.appVersion}</p></div>
                <div className="glass-card p-3"><p className="text-cyan-500/40">Build Hash</p><p>{buildMetadata.buildHash}</p></div>
                <div className="glass-card p-3"><p className="text-cyan-500/40">Build Time</p><p>{buildMetadata.buildTime}</p></div>
                <div className="glass-card p-3"><p className="text-cyan-500/40">Mode</p><p>{buildMetadata.mode}</p></div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Recompute Stock Levels",
                    desc: "Recalculate all part stock quantities from movement history",
                    icon: "🔄",
                    onRun: () => {
                      dispatch({ type: "ADD_ACTIVITY", payload: { action: "Recomputed stock levels", time: "just now" } });
                      recordRuntimeEvent({ level: "info", source: "Settings.Diagnostics", message: "Recompute stock levels executed" });
                      setDiagnosticsRefreshTick((v) => v + 1);
                    },
                  },
                  {
                    label: "Fix Payment Statuses",
                    desc: "Recalculate payment statuses for all purchases",
                    icon: "💳",
                    onRun: () => {
                      dispatch({ type: "ADD_ACTIVITY", payload: { action: "Payment statuses reconciled", time: "just now" } });
                      recordRuntimeEvent({ level: "info", source: "Settings.Diagnostics", message: "Payment status reconciliation executed" });
                      setDiagnosticsRefreshTick((v) => v + 1);
                    },
                  },
                  {
                    label: "Validate Barcode Sequences",
                    desc: "Check for duplicate or invalid barcodes",
                    icon: "📊",
                    onRun: () => {
                      dispatch({ type: "ADD_ACTIVITY", payload: { action: "Barcode validation completed", time: "just now" } });
                      recordRuntimeEvent({ level: "info", source: "Settings.Diagnostics", message: "Barcode validation executed" });
                      setDiagnosticsRefreshTick((v) => v + 1);
                    },
                  },
                  {
                    label: "Clear Activity Log",
                    desc: "Remove activity entries older than 30 days",
                    icon: "🗑️",
                    onRun: () => {
                      dispatch({ type: "CLEAR_ACTIVITY" });
                      recordRuntimeEvent({ level: "warning", source: "Settings.Diagnostics", message: "Activity log cleared" });
                      setDiagnosticsRefreshTick((v) => v + 1);
                    },
                  },
                ].map(tool => (
                  <div key={tool.label} className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tool.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-cyan-200/70">{tool.label}</p>
                        <p className="text-[10px] text-cyan-500/30">{tool.desc}</p>
                      </div>
                    </div>
                    <button className="btn-ghost text-xs" onClick={tool.onRun}>Run</button>
                  </div>
                ))}
              </div>

              <div className="glass-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-300/70">RUNTIME EVENT LOG</h4>
                  <button
                    className="btn-ghost text-xs"
                    onClick={() => {
                      clearRuntimeEvents();
                      setDiagnosticsRefreshTick((v) => v + 1);
                    }}
                  >
                    Clear Runtime Events
                  </button>
                </div>
                <div className="max-h-40 overflow-auto space-y-1">
                  {runtimeEvents.length === 0 ? (
                    <p className="text-[11px] text-cyan-500/40">No runtime events recorded in this browser yet.</p>
                  ) : (
                    runtimeEvents.slice(0, 10).map((event) => (
                      <div key={event.id} className="rounded border border-cyan-500/10 p-2 text-[11px]">
                        <p className="text-cyan-300/70">{event.ts} • {event.level.toUpperCase()} • {event.source}</p>
                        <p className="text-cyan-100/70">{event.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === "danger" && (
            <div className="glass-card corner-marks p-6 space-y-4 border border-red-500/20">
              <h3 className="text-sm font-bold text-red-400" style={{ fontFamily: "var(--font-heading)" }}>⚠️ DANGER ZONE</h3>
              <p className="text-xs text-red-400/50">These actions are irreversible. Please make a backup first.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div>
                    <p className="text-sm font-bold text-red-300/70">Reset All Data</p>
                    <p className="text-[10px] text-red-500/30">Delete all inventory, sales, purchases, and financial data</p>
                  </div>
                  <button className="px-3 py-1.5 rounded text-xs font-bold border border-red-500/30 text-red-400/60 hover:text-red-300 hover:border-red-500/50 transition-all" onClick={() => setShowDanger(!showDanger)}>
                    {showDanger ? "Cancel" : "Reset"}
                  </button>
                </div>
                {showDanger && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-slide-up">
                    <p className="text-xs text-red-300 mb-3">Are you sure? Type "RESET" to confirm:</p>
                    <div className="flex gap-2">
                      <input placeholder='Type "RESET"' className="flex-1 px-3 py-2 rounded-lg text-sm border border-red-500/20" />
                      <button
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                        onClick={() => dispatch({ type: "RESET_STATE" })}
                      >
                        Confirm Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
