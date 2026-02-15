import { FormField } from "@/components/ui/Form/FormField";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  prefix?: string;
  suffix?: string;
};

export function Input({ name, label, error, touched, required, helpText, prefix, suffix, ...props }: InputProps) {
  return (
    <FormField name={name} label={label} error={error} touched={touched} required={required} helpText={helpText}>
      <div data-component="ui-Form-Input" data-testid="component-ui-Form-Input" className="flex items-center gap-2">
        {prefix && <span>{prefix}</span>}
        <input id={name} aria-invalid={!!error} aria-describedby={`${name}-error ${name}-help`} className="w-full px-3 py-2 rounded" {...props} />
        {suffix && <span>{suffix}</span>}
      </div>
    </FormField>
  );
}
