export function WizardProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const pct = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 100;
  return (
    <div data-component="ui-Wizard-WizardProgress" data-testid="component-ui-Wizard-WizardProgress" className="w-full h-2 bg-cyan-900/40 rounded">
      <div className="h-full bg-cyan-400 rounded" style={{ width: `${pct}%` }} />
    </div>
  );
}
