export function FormLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return <label htmlFor={htmlFor} className="text-sm">{label}{required ? " *" : ""}</label>;
}
