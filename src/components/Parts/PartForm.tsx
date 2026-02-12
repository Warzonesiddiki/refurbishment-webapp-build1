import { useState } from "react";

type PartFormValue = {
  sku: string;
  name: string;
  minStock: number;
};

type PartFormProps = {
  initial?: PartFormValue;
  onSubmit: (value: PartFormValue) => void;
};

export function PartForm({ initial = { sku: "", name: "", minStock: 0 }, onSubmit }: PartFormProps) {
  const [value, setValue] = useState<PartFormValue>(initial);
  const valid = value.sku.trim().length > 0 && value.name.trim().length > 0;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(value); }} className="space-y-3">
      <input aria-label="SKU" value={value.sku} onChange={(e) => setValue({ ...value, sku: e.target.value })} />
      <input aria-label="Name" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} />
      <input aria-label="Min Stock" type="number" value={value.minStock} onChange={(e) => setValue({ ...value, minStock: Number(e.target.value) })} />
      {!valid && <p role="alert">SKU and Name are required</p>}
      <button type="submit" disabled={!valid}>Save</button>
    </form>
  );
}
