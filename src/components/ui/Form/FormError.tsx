export function FormError({ id, error, touched }: { id: string; error?: string; touched?: boolean }) {
  if (!error || !touched) return null;
  return <p id={id} role="alert" className="text-xs text-red-300">{error}</p>;
}
