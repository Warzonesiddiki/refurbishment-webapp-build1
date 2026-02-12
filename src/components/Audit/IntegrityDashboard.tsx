import type { IntegrityReport } from "@/store/types/IntegrityTypes";

export function IntegrityDashboard({ report, onRun }: { report: IntegrityReport | null; onRun?: () => void }) {
  return (
    <div className="glass-card p-4 space-y-2">
      <h3 className="font-bold">Integrity Dashboard</h3>
      <button className="btn-ghost" onClick={onRun}>Run full check</button>
      {!report ? <p>No report yet.</p> : (
        <>
          <div>Status: {report.invalidCount ? "critical" : "ok"}</div>
          <div>Valid: {report.validCount} / {report.totalRecords}</div>
          <ul>{report.issues.map((i) => <li key={`${i.entityType}-${i.entityId}`}>{i.severity}: {i.description}</li>)}</ul>
        </>
      )}
    </div>
  );
}
