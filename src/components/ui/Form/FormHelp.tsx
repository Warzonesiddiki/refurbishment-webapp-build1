export function FormHelp({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return <p id={id} className="text-xs text-cyan-300/60">{text}</p>;
}
