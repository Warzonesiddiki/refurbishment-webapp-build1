import { useEffect, useRef, useState } from "react";

type InlineEditProps = {
  value: string | number;
  onSave: (value: string | number) => Promise<void> | void;
  validate?: (value: string) => string | undefined;
  type?: "text" | "number";
  placeholder?: string;
  disabled?: boolean;
};

export function InlineEdit({ value, onSave, validate, type = "text", placeholder, disabled }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(String(value)), [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = async () => {
    const err = validate?.(draft);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave(type === "number" ? Number(draft) : draft);
      setEditing(false);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return <button disabled={disabled} onDoubleClick={() => setEditing(true)} onClick={() => setEditing(true)}>{String(value) || placeholder || "-"}</button>;
  }

  return (
    <div>
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") void commit();
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(String(value));
          }
        }}
      />
      {saving && <span>...</span>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
