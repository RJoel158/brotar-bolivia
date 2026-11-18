import type { ChangeEvent } from 'react';
import { Button } from '../../../../shared/index.ts';
import { CampaignCreationNav } from '../components/CampaignCreationNav.tsx';
import { CampaignStepProgress } from '../components/CampaignStepProgress.tsx';
import type { CampaignCreationDraft } from '../types.ts';
import './StepStoryImpact.css';

export interface StepStoryImpactProps {
  draft: CampaignCreationDraft;
  onChange: (patch: Partial<CampaignCreationDraft>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const STORY_FIELDS: ReadonlyArray<{
  name: keyof Pick<
    CampaignCreationDraft,
    'problem' | 'solution' | 'beneficiaries' | 'expectedImpact' | 'impactIndicators'
  >;
  label: string;
  placeholder: string;
}> = [
  {
    name: 'problem',
    label: 'Problema',
    placeholder: 'Qué situación busca atender la campaña.',
  },
  {
    name: 'solution',
    label: 'Solución',
    placeholder: 'Cómo el proyecto responde a ese problema.',
  },
  {
    name: 'beneficiaries',
    label: 'Beneficiarios',
    placeholder: 'Quiénes se benefician de la campaña.',
  },
  {
    name: 'expectedImpact',
    label: 'Impacto esperado',
    placeholder: 'Qué cambio concreto se espera lograr.',
  },
  {
    name: 'impactIndicators',
    label: 'Indicadores de impacto',
    placeholder: 'Cómo se medirá el avance o el resultado.',
  },
];

export function StepStoryImpact({
  draft,
  onChange,
  onNext,
  onPrevious,
}: StepStoryImpactProps) {
  return (
    <section className="step-story-impact">
      <CampaignStepProgress step={3} />

      <div className="step-story-impact__layout">
        <CampaignCreationNav currentStep={3} />

        <div className="step-story-impact__content">
          <header className="step-story-impact__header">
            <h1>Historia e impacto</h1>
            <p>Describe el problema, la solución y el impacto esperado. Estos campos son opcionales.</p>
          </header>

          <div className="step-story-impact__form">
            {STORY_FIELDS.map((field) => (
              <div className="step-story-impact__field" key={field.name}>
                <label className="step-story-impact__label" htmlFor={`campaign-${field.name}`}>
                  {field.label}
                </label>
                <textarea
                  id={`campaign-${field.name}`}
                  name={field.name}
                  rows={4}
                  className="step-story-impact__textarea"
                  value={draft[field.name]}
                  placeholder={field.placeholder}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    onChange({ [field.name]: event.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <div className="step-story-impact__actions">
            <Button variant="tertiary" onClick={onPrevious}>
              Atrás
            </Button>
            <div className="step-story-impact__actions-right">
              <Button variant="secondary" disabled>
                Guardar progreso
              </Button>
              <Button variant="primary" onClick={onNext}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
