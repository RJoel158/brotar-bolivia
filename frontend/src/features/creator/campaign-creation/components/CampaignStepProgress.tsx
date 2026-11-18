import { TOTAL_WIZARD_STEPS, type WizardStep } from '../types.ts';
import { getStepCompletionPercent } from '../state.ts';
import './CampaignStepProgress.css';

export interface CampaignStepProgressProps {
  step: WizardStep;
}

export function CampaignStepProgress({ step }: CampaignStepProgressProps) {
  const percent = getStepCompletionPercent(step);

  return (
    <div className="campaign-step-progress">
      <div className="campaign-step-progress__meta">
        <span>
          Paso {step} de {TOTAL_WIZARD_STEPS}
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="campaign-step-progress__track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso del asistente: paso ${step} de ${TOTAL_WIZARD_STEPS}`}
      >
        <div className="campaign-step-progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
