import { FormField } from "@/components/ui/Form/FormField";

export function Select({
  name,
  label,
  options,
  error,
  touched,
  required,
  helpText,
  ...props
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FormField name={name} label={label} error={error} touched={touched} required={required} helpText={helpText}>
      <select id={name} aria-invalid={!!error} className="w-full px-3 py-2 rounded" {...props}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FormField>
  );
}
