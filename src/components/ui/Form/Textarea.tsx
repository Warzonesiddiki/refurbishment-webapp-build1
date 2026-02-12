import { FormField } from "@/components/ui/Form/FormField";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string;
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  showCount?: boolean;
};

export function Textarea({ name, label, error, touched, required, helpText, showCount, value, maxLength, ...props }: TextareaProps) {
  const count = String(value ?? "").length;
  return (
    <FormField name={name} label={label} error={error} touched={touched} required={required} helpText={helpText}>
      <textarea id={name} value={value} maxLength={maxLength} aria-invalid={!!error} className="w-full px-3 py-2 rounded" {...props} />
      {showCount && maxLength ? <p className="text-xs">{count}/{maxLength}</p> : null}
    </FormField>
  );
}
