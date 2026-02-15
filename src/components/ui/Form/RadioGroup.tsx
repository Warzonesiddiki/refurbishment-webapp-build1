import { FormField } from "@/components/ui/Form/FormField";

export function RadioGroup({
  name,
  label,
  value,
  onChange,
  options,
  error,
  touched,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
  touched?: boolean;
}) {
  return (
    <FormField name={name} label={label} error={error} touched={touched}>
      <div data-component="ui-Form-RadioGroup" data-testid="component-ui-Form-RadioGroup" className="flex gap-3">
        {options.map((o) => (
          <label key={o.value}>
            <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} /> {o.label}
          </label>
        ))}
      </div>
    </FormField>
  );
}
