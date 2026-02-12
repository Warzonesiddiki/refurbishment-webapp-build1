import type { PartMovement } from "@/store/types/PartMovementTypes";

export function MovementHistory({ movements }: { movements: PartMovement[] }) {
  return <ul>{movements.map((m) => <li key={m.id}>{m.type} {m.quantity}</li>)}</ul>;
}
