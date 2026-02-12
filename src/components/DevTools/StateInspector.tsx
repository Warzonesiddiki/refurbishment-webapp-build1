export function StateInspector({ state }: { state: unknown }) {
  return <pre className="text-xs max-h-[280px] overflow-auto bg-black/20 p-2 rounded">{JSON.stringify(state, null, 2)}</pre>;
}
