export function handleFormError(error: unknown, setError: (name: string, message: string) => void) {
  if (typeof error === "object" && error && "fieldErrors" in error) {
    const entries = Object.entries((error as { fieldErrors: Record<string, string> }).fieldErrors);
    entries.forEach(([k, v]) => setError(k, v));
    return;
  }
  setError("_form", "Submission failed");
}

export function transformFormData<T, U>(data: T, transform: (d: T) => U): U {
  return transform(data);
}

export function createFormData(values: Record<string, unknown>): FormData {
  const fd = new FormData();
  Object.entries(values).forEach(([k, v]) => {
    if (v instanceof Blob) fd.append(k, v);
    else fd.append(k, String(v));
  });
  return fd;
}

export function parseFormError(error: { errors?: Record<string, string> }) {
  return error.errors ?? {};
}
