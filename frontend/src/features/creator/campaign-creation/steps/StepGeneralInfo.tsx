import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button, Input } from '../../../../shared/index.ts';
import { CampaignCreationNav } from '../components/CampaignCreationNav.tsx';
import { CampaignStepProgress } from '../components/CampaignStepProgress.tsx';
import { CoverImageField } from '../components/CoverImageField.tsx';
import {
  CAMPAIGN_CATEGORY_OPTIONS,
  MAX_TITLE_LENGTH,
  MIN_SHORT_SUMMARY_LENGTH,
  MIN_TITLE_LENGTH,
  SHORT_SUMMARY_MAX_LENGTH,
  type CampaignCategoryValue,
  type CampaignCreationDraft,
} from '../types.ts';
import { canProceedStep2, getCampaignTitleError } from '../state.ts';
import './StepGeneralInfo.css';

export interface StepGeneralInfoProps {
  draft: CampaignCreationDraft;
  existingCoverImageUrl?: string | null;
  onChange: (patch: Partial<CampaignCreationDraft>) => void;
  onClearExistingCover?: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function StepGeneralInfo({
  draft,
  existingCoverImageUrl = null,
  onChange,
  onClearExistingCover,
  onNext,
  onPrevious,
}: StepGeneralInfoProps) {
  const [titleTouched, setTitleTouched] = useState(false);
  const summaryLength = draft.shortSummary.trim().length;
  const canContinue = canProceedStep2(draft);
  const titleError =
    titleTouched || draft.title.length > 0
      ? getCampaignTitleError(draft.title) ?? undefined
      : undefined;
  const summaryError =
    draft.shortSummary.length > 0 && summaryLength < MIN_SHORT_SUMMARY_LENGTH
      ? `El resumen debe tener al menos ${MIN_SHORT_SUMMARY_LENGTH} caracteres.`
      : undefined;

  return (
    <section className="step-general-info">
      <CampaignStepProgress step={2} />

      <div className="step-general-info__layout">
        <CampaignCreationNav currentStep={2} />

        <div className="step-general-info__content">
          <header className="step-general-info__header">
            <h1>Información general</h1>
            <p>Completa la información básica de tu campaña.</p>
          </header>

          <div className="step-general-info__form">
            <Input
              label="Nombre del proyecto"
              name="title"
              required
              maxLength={MAX_TITLE_LENGTH}
              value={draft.title}
              placeholder="Nombre del proyecto"
              helperText={`Entre ${MIN_TITLE_LENGTH} y ${MAX_TITLE_LENGTH} caracteres, con al menos una letra.`}
              error={titleError}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ title: event.target.value })}
              onBlur={() => setTitleTouched(true)}
            />

            <div className="step-general-info__field">
              <label className="step-general-info__label" htmlFor="campaign-category">
                Categoría <span aria-hidden="true">*</span>
              </label>
              <select
                id="campaign-category"
                name="category"
                required
                className="step-general-info__select"
                value={draft.category ?? ''}
                onChange={(event) => {
                  const value = event.target.value as CampaignCategoryValue | '';
                  onChange({ category: value === '' ? null : value });
                }}
              >
                <option value="">Selecciona una categoría</option>
                {CAMPAIGN_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Ubicación"
              name="location"
              required
              value={draft.location}
              placeholder="Ciudad, país"
              onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ location: event.target.value })}
            />

            <div className="step-general-info__field">
              <label className="step-general-info__label" htmlFor="campaign-summary">
                Resumen corto <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="campaign-summary"
                name="shortSummary"
                required
                maxLength={SHORT_SUMMARY_MAX_LENGTH}
                rows={4}
                className="step-general-info__textarea"
                value={draft.shortSummary}
                placeholder="Resumen breve del proyecto"
                onChange={(event) => onChange({ shortSummary: event.target.value })}
              />
              <p className="step-general-info__counter">
                {summaryLength}/{SHORT_SUMMARY_MAX_LENGTH}
              </p>
              {summaryError ? (
                <p className="step-general-info__error" role="alert">
                  {summaryError}
                </p>
              ) : (
                <p className="step-general-info__hint">
                  Mínimo {MIN_SHORT_SUMMARY_LENGTH} caracteres.
                </p>
              )}
            </div>

            <CoverImageField
              file={draft.coverImage}
              existingUrl={existingCoverImageUrl}
              onChange={(file) => onChange({ coverImage: file })}
              onClearExisting={onClearExistingCover}
            />
          </div>

          <div className="step-general-info__actions">
            <Button variant="tertiary" onClick={onPrevious}>
              Atrás
            </Button>
            <div className="step-general-info__actions-right">
              <Button variant="secondary" disabled>
                Guardar progreso
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
          {canContinue ? null : (
            <p className="step-general-info__ready">Completa los campos obligatorios para continuar.</p>
          )}
        </div>
      </div>
    </section>
  );
}
