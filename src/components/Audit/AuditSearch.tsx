import { useEffect, useState } from "react";

export function AuditSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => onChange(local), 250);
    return () => window.clearTimeout(t);
  }, [local, onChange]);
  return <input aria-label="audit-search" className="w-full px-3 py-2 rounded-lg" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Search audit logs (action:, entity:, user:, result:)" />;
}
