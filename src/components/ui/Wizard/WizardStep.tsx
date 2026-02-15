export function WizardStep({ title, description, active, completed }: { title: string; description?: string; active?: boolean; completed?: boolean }) {
  return (
    <div data-component="ui-Wizard-WizardStep" data-testid="component-ui-Wizard-WizardStep" className={`p-2 rounded ${active ? "bg-cyan-500/20" : ""}`}>
      <p>{completed ? "✓ " : ""}{title}</p>
      {description ? <p className="text-xs text-cyan-300/70">{description}</p> : null}
    </div>
  );
}
