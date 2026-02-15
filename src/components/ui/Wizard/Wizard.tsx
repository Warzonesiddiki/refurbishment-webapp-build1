import { useState } from "react";
import { WizardProgress } from "@/components/ui/Wizard/WizardProgress";
import { WizardStep } from "@/components/ui/Wizard/WizardStep";

export type WizardStepDef = {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<{ data: Record<string, unknown>; updateData: (partial: Record<string, unknown>) => void }>;
  validate?: () => boolean | Promise<boolean>;
  optional?: boolean;
};

export function Wizard({
  steps,
  initialStep = 0,
  onComplete,
  onCancel,
}: {
  steps: WizardStepDef[];
  initialStep?: number;
  onComplete: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [idx, setIdx] = useState(initialStep);
  const [data, setData] = useState<Record<string, unknown>>({});
  const Active = steps[idx].component;

  const next = async () => {
    const ok = (await steps[idx].validate?.()) ?? true;
    if (!ok) return;
    if (idx === steps.length - 1) onComplete(data);
    else setIdx((v) => v + 1);
  };

  return (
    <div data-component="ui-Wizard-Wizard" data-testid="component-ui-Wizard-Wizard" className="space-y-3">
      <WizardProgress currentStep={idx} totalSteps={steps.length} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="space-y-1">{steps.map((s, i) => <WizardStep key={s.id} title={s.title} description={s.description} active={i===idx} completed={i<idx} />)}</div>
        <div className="md:col-span-3">
          <Active data={data} updateData={(p) => setData((d) => ({ ...d, ...p }))} />
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={onCancel}>Cancel</button>
            <button onClick={() => setIdx((v) => Math.max(0, v - 1))} disabled={idx===0}>Back</button>
            <button onClick={() => void next()}>{idx===steps.length-1 ? "Finish" : "Next"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
