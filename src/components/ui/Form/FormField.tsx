import { FormError } from "@/components/ui/Form/FormError";
import { FormHelp } from "@/components/ui/Form/FormHelp";
import { FormLabel } from "@/components/ui/Form/FormLabel";

export function FormField({
  name,
  label,
  required,
  error,
  touched,
  helpText,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  helpText?: string;
  children: React.ReactNode;
}) {
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;
  return (
    <div className="space-y-1">
      <FormLabel htmlFor={name} label={label} required={required} />
      {children}
      <FormHelp id={helpId} text={helpText} />
      <FormError id={errorId} error={error} touched={touched} />
    </div>
  );
}
