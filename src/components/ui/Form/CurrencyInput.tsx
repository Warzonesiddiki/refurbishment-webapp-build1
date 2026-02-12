import { Input } from "@/components/ui/Form/Input";

export function CurrencyInput(props: Omit<React.ComponentProps<typeof Input>, "type" | "prefix"> & { symbol?: string }) {
  return <Input type="number" step="0.01" prefix={props.symbol ?? "AED"} {...props} />;
}
