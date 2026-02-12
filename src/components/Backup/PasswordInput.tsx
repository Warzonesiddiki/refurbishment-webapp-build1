export function PasswordInput({ value, onChange, label = "Password" }: { value: string; onChange: (v: string) => void; label?: string }) {
  const strength = value.length >= 12 ? "strong" : value.length >= 8 ? "medium" : "weak";
  return (
    <div className="space-y-1">
      <label className="text-xs text-cyan-400/60">{label}</label>
      <input type="password" className="w-full px-3 py-2 rounded-lg" value={value} onChange={(e) => onChange(e.target.value)} />
      <p className="text-[10px] text-cyan-500/40">Strength: {strength}</p>
    </div>
  );
}
