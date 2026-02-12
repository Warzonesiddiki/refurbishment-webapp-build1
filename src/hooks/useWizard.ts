import { useState } from "react";

export type StepConfig = { validate?: () => boolean | Promise<boolean> };

export function useWizard<T>(config: { steps: StepConfig[]; initialData: Partial<T>; onStepChange?: (step: number, data: Partial<T>) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<T>>(config.initialData);
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});

  const totalSteps = config.steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const goNext = async () => {
    const validate = config.steps[currentStep]?.validate;
    const ok = validate ? await validate() : true;
    if (!ok) return false;
    setCurrentStep((s) => Math.min(totalSteps - 1, s + 1));
    config.onStepChange?.(Math.min(totalSteps - 1, currentStep + 1), data);
    return true;
  };

  const goPrev = () => setCurrentStep((s) => Math.max(0, s - 1));
  const goToStep = (n: number) => setCurrentStep(Math.max(0, Math.min(totalSteps - 1, n)));

  return {
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    data,
    stepErrors,
    goNext,
    goPrev,
    goToStep,
    updateData: (partial: Partial<T>) => setData((d) => ({ ...d, ...partial })),
    setStepError: (step: number, errors: string[]) => setStepErrors((curr) => ({ ...curr, [step]: errors })),
    reset: () => {
      setCurrentStep(0);
      setData(config.initialData);
      setStepErrors({});
    },
    canProceed: (stepErrors[currentStep]?.length ?? 0) === 0,
    progress: totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 100,
  };
}
