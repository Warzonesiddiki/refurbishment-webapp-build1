import type { FormattedDiff } from "@/utils/diffCalculator";

export function DiffViewer({ diffs }: { diffs: FormattedDiff[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr><th className="text-left">Field</th><th className="text-left">Before</th><th className="text-left">After</th></tr></thead>
      <tbody>
        {diffs.filter((d) => d.isSignificant).map((d) => (
          <tr key={d.label}><td>{d.label}</td><td className="text-red-300">{d.oldValueDisplay}</td><td className="text-green-300">{d.newValueDisplay}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
