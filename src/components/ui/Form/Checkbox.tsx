import { FormField } from "@/components/ui/Form/FormField";

export function Checkbox({ name, label, error, touched, required, helpText, ...props }: {
  name: string;
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FormField name={name} label={label} error={error} touched={touched} required={required} helpText={helpText}>
      <input id={name} type="checkbox" {...props} />
    </FormField>
  );
}
