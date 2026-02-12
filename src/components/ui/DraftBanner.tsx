export function DraftBanner({ text, onDiscard }: { text: string; onDiscard: () => void }) {
  return (
    <div className="glass-card p-2 text-xs flex justify-between">
      <span>{text}</span>
      <button onClick={onDiscard}>Discard</button>
    </div>
  );
}
