import { Button } from '../../../../shared/index.ts';
import { CampaignStepProgress } from '../components/CampaignStepProgress.tsx';
import { CampaignTypeCard } from '../components/CampaignTypeCard.tsx';
import { CAMPAIGN_TYPE_OPTIONS, type CampaignCreationDraft, type CampaignTypeValue } from '../types.ts';
import { canProceedStep1 } from '../state.ts';
import './StepCampaignType.css';

export interface StepCampaignTypeProps {
  draft: CampaignCreationDraft;
  onChangeType: (value: CampaignTypeValue) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function StepCampaignType({
  draft,
  onChangeType,
  onContinue,
  onBack,
}: StepCampaignTypeProps) {
  return (
    <section className="step-campaign-type">
      <CampaignStepProgress step={1} />

      <header className="step-campaign-type__header">
        <h1>Tipo de campaña</h1>
        <p>Selecciona el modelo de tu campaña.</p>
      </header>

      <div className="step-campaign-type__options" role="group" aria-label="Tipo de campaña">
        {CAMPAIGN_TYPE_OPTIONS.map((option) => (
          <CampaignTypeCard
            key={option.value}
            value={option.value}
            title={option.title}
            description={option.description}
            selected={draft.campaignType === option.value}
            onSelect={onChangeType}
          />
        ))}
      </div>

      <div className="step-campaign-type__actions">
        <Button variant="tertiary" onClick={onBack}>
          Atrás
        </Button>
        <Button variant="primary" onClick={onContinue} disabled={!canProceedStep1(draft)}>
          Continuar
        </Button>
      </div>
    </section>
  );
}
