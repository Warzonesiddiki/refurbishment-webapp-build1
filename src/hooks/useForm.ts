import { useState } from "react";

type SimpleSchema<T> = { safeParse: (input: unknown) => { success: true; data: T } | { success: false; errors: Record<string, string> } };

export type UseFormConfig<T> = {
  schema: SimpleSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit?: (data: T) => Promise<void> | void;
  onError?: (errors: Record<string, string>) => void;
  mode?: "onSubmit" | "onBlur" | "onChange" | "all";
  resetOnSubmit?: boolean;
};

export function useForm<T extends Record<string, unknown>>(config: UseFormConfig<T>) {
  const [values, setValues] = useState<Partial<T>>(config.defaultValues ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

  const register = (name: keyof T) => ({
    name: String(name),
    value: values[name] as string | number | readonly string[] | undefined,
    onChange: (e: { target: { value: unknown } }) => {
      setValues((v) => ({ ...v, [name]: e.target.value as T[keyof T] }));
      setDirtyFields((d) => ({ ...d, [String(name)]: true }));
      if (config.mode === "onChange" || config.mode === "all") void trigger(name);
    },
    onBlur: () => {
      setTouched((t) => ({ ...t, [String(name)]: true }));
      if (config.mode === "onBlur" || config.mode === "all") void trigger(name);
    },
  });

  const trigger = async (name?: keyof T) => {
    const result = config.schema.safeParse(values);
    if (result.success) {
      if (name) {
        setErrors((curr) => {
          const next = { ...curr };
          delete next[String(name)];
          return next;
        });
      } else {
        setErrors({});
      }
      return true;
    }

    if (name) {
      setErrors((curr) => ({ ...curr, [String(name)]: result.errors[String(name)] ?? curr[String(name)] }));
    } else {
      setErrors(result.errors);
    }
    return false;
  };

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    const ok = await trigger();
    if (!ok) {
      config.onError?.(errors);
      return;
    }

    setIsSubmitting(true);
    setIsSubmitSuccessful(false);
    try {
      const parsed = config.schema.safeParse(values);
      if (!parsed.success) return;
      await config.onSubmit?.(parsed.data);
      setIsSubmitSuccessful(true);
      if (config.resetOnSubmit) {
        setValues(config.defaultValues ?? {});
        setErrors({});
        setTouched({});
        setDirtyFields({});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearErrors = (name?: keyof T) => {
    if (!name) setErrors({});
    else setErrors((curr) => {
      const next = { ...curr };
      delete next[String(name)];
      return next;
    });
  };

  const setError = (name: keyof T, message: string) => setErrors((curr) => ({ ...curr, [String(name)]: message }));

  const isDirty = Object.keys(dirtyFields).length > 0;
  const isValid = Object.keys(errors).length === 0;

  return {
    register,
    handleSubmit,
    setValue: (name: keyof T, value: unknown) => {
      setValues((v) => ({ ...v, [name]: value as T[keyof T] }));
      setDirtyFields((d) => ({ ...d, [String(name)]: true }));
    },
    getValue: (name: keyof T) => values[name],
    getValues: () => values,
    errors,
    touched,
    dirtyFields,
    isValid,
    isDirty,
    isSubmitting,
    isSubmitSuccessful,
    reset: (next?: Partial<T>) => {
      setValues(next ?? config.defaultValues ?? {});
      setErrors({});
      setTouched({});
      setDirtyFields({});
      setIsSubmitSuccessful(false);
    },
    clearErrors,
    setError,
    trigger,
  };
}
