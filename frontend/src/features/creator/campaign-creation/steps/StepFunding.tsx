import type { ChangeEvent } from 'react';
import { Button, Input } from '../../../../shared/index.ts';
import { CampaignCreationNav } from '../components/CampaignCreationNav.tsx';
import { CampaignStepProgress } from '../components/CampaignStepProgress.tsx';
import { CampaignTypeCard } from '../components/CampaignTypeCard.tsx';
import {
  FUNDING_MODEL_OPTIONS,
  MAX_GOAL_AMOUNT,
  MIN_GOAL_AMOUNT,
  type CampaignCreationDraft,
  type FundingModelValue,
} from '../types.ts';
import { canCreateCampaign, canProceedStep5 } from '../state.ts';
import './StepFunding.css';

export interface StepFundingProps {
  draft: CampaignCreationDraft;
  onChange: (patch: Partial<CampaignCreationDraft>) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  createdCampaignId: string | null;
  submitError: string | null;
  isDirty: boolean;
  saveFeedback: 'created' | 'updated' | null;
  disableEdit?: boolean;
}

function parseGoalAmount(raw: string): number | null {
  if (raw.trim() === '') {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function StepFunding({
  draft,
  onChange,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  createdCampaignId,
  submitError,
  isDirty,
  saveFeedback,
  disableEdit = false,
}: StepFundingProps) {
  const canContinue = canProceedStep5(draft);
  const alreadyCreated = createdCampaignId !== null;
  const canSubmit =
    !disableEdit &&
    canCreateCampaign(draft) &&
    !isSubmitting &&
    (!alreadyCreated || isDirty);
  const goalAmountValue = draft.goalAmount === null ? '' : String(draft.goalAmount);
  const showGoalError =
    draft.goalAmount !== null &&
    (draft.goalAmount < MIN_GOAL_AMOUNT || draft.goalAmount > MAX_GOAL_AMOUNT);

  return (
    <section className="step-funding">
      <CampaignStepProgress step={5} />

      <div className="step-funding__layout">
        <CampaignCreationNav currentStep={5} />

        <div className="step-funding__content">
          <header className="step-funding__header">
            <h1>Financiamiento</h1>
            <p>Define el modelo de recaudación y la meta de tu campaña.</p>
          </header>

          <div className="step-funding__form">
            <div className="step-funding__field">
              <p className="step-funding__label" id="funding-model-label">
                Modelo de financiamiento <span aria-hidden="true">*</span>
              </p>
              <div
                className="step-funding__options"
                role="group"
                aria-labelledby="funding-model-label"
              >
                {FUNDING_MODEL_OPTIONS.map((option) => (
                  <CampaignTypeCard
                    key={option.value}
                    value={option.value}
                    title={option.title}
                    description={option.description}
                    selected={draft.fundingModel === option.value}
                    onSelect={(value: FundingModelValue) => {
                      if (!disableEdit) {
                        onChange({ fundingModel: value });
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            <Input
              label="Meta de recaudación"
              name="goalAmount"
              type="number"
              required
              min={MIN_GOAL_AMOUNT}
              max={MAX_GOAL_AMOUNT}
              step="1"
              value={goalAmountValue}
              placeholder="Monto en BOB"
              helperText={`Mínimo ${MIN_GOAL_AMOUNT} BOB.`}
              disabled={disableEdit}
              error={
                showGoalError
                  ? `La meta debe estar entre ${MIN_GOAL_AMOUNT} y ${MAX_GOAL_AMOUNT} BOB.`
                  : undefined
              }
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onChange({ goalAmount: parseGoalAmount(event.target.value) })
              }
            />
          </div>

          <div className="step-funding__actions">
            <Button variant="tertiary" onClick={onPrevious} disabled={isSubmitting}>
              Atrás
            </Button>
            <div className="step-funding__actions-right">
              <Button
                variant="secondary"
                onClick={onSubmit}
                disabled={!canSubmit}
              >
                {isSubmitting
                  ? 'Guardando...'
                  : alreadyCreated
                    ? 'Actualizar borrador'
                    : 'Guardar borrador'}
              </Button>
              <Button
                variant="primary"
                onClick={onNext}
                disabled={!canContinue}
              >
                Siguiente
              </Button>
            </div>
          </div>
          {submitError ? (
            <p className="step-funding__error" role="alert">
              {submitError}
            </p>
          ) : saveFeedback === 'updated' ? (
            <p className="step-funding__success">Campaña actualizada.</p>
          ) : saveFeedback === 'created' ? (
            <p className="step-funding__success">Campaña guardada como borrador.</p>
          ) : !canContinue ? (
            <p className="step-funding__ready">Completa el modelo y la meta para continuar.</p>
          ) : alreadyCreated && !isDirty ? (
            <p className="step-funding__ready">No hay cambios pendientes por guardar.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
