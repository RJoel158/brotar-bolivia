import { useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Gift,
  ImageOff,
  MapPin,
  Pencil,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { Badge, Button } from '../../../../shared/index.ts';
import type { BadgeVariant } from '../../../../shared/index.ts';
import { CampaignCreationNav } from '../components/CampaignCreationNav.tsx';
import { CampaignStepProgress } from '../components/CampaignStepProgress.tsx';
import { CampaignPlanBudgetView } from '../../../campaigns/components/CampaignPlanBudgetView.tsx';
import { CAMPAIGN_STATUS_LABELS } from '../../../campaigns/campaignStatusLabels.ts';
import type { CampaignCreationDraft, CampaignPlanningDraft, WizardStep } from '../types.ts';
import {
  CAMPAIGN_CATEGORY_OPTIONS,
  CAMPAIGN_TYPE_OPTIONS,
  FUNDING_MODEL_OPTIONS,
  MAX_GOAL_AMOUNT,
  MIN_GOAL_AMOUNT,
  MIN_SHORT_SUMMARY_LENGTH,
  SHORT_SUMMARY_MAX_LENGTH,
} from '../types.ts';
import { canCreateCampaign, getCampaignTitleError } from '../state.ts';
import { describeRewardSlots, formatBob, formatIsoDate } from '../planningValidation.ts';
import '../components/WizardPanel.css';
import './StepFinalReview.css';

export interface StepFinalReviewProps {
  draft: CampaignCreationDraft;
  planning: CampaignPlanningDraft;
  pendingRewardIds: ReadonlySet<string>;
  rewardsLoadError: string | null;
  isLoadingRewards?: boolean;
  planLoadError?: string | null;
  campaignStatus: string | null;
  kycStatus?: string | null;
  coverImageUrl?: string | null;
  isSubmitting: boolean;
  isDirty: boolean;
  createdCampaignId: string | null;
  submitError: string | null;
  saveFeedback: 'created' | 'updated' | 'submitted' | null;
  onPrevious: () => void;
  onSaveDraft: () => void;
  onSubmitReview: () => void;
  /** Goes to a previous step without saving; the wizard keeps the draft in memory. */
  onEditStep?: (step: WizardStep) => void;
}

interface PendingItem {
  id: string;
  message: string;
  step: WizardStep;
}

const KYC_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pendiente de envío o revisión', variant: 'pending' },
  verified: { label: 'Identidad verificada', variant: 'confirmed' },
  rejected: { label: 'Rechazado', variant: 'failed' },
  requires_documentation: { label: 'Requiere documentación adicional', variant: 'pending' },
};

const CAMPAIGN_STATUS_VARIANT: Record<string, BadgeVariant> = {
  draft: 'expired',
  pending_review: 'review',
  approved: 'confirmed',
  changes_requested: 'pending',
  rejected: 'failed',
  published: 'published',
};

const STORY_FIELDS: ReadonlyArray<{
  key: 'problem' | 'solution' | 'beneficiaries' | 'expectedImpact' | 'impactIndicators';
  label: string;
}> = [
  { key: 'problem', label: 'Problema' },
  { key: 'solution', label: 'Solución' },
  { key: 'beneficiaries', label: 'Beneficiarios' },
  { key: 'expectedImpact', label: 'Impacto esperado' },
  { key: 'impactIndicators', label: 'Indicadores de impacto' },
];

function labelOf<T extends string>(
  options: ReadonlyArray<{ value: T; title?: string; label?: string }>,
  value: T | null,
): string | null {
  if (!value) return null;
  const found = options.find((option) => option.value === value);
  return found?.title ?? found?.label ?? value;
}

/** Mirrors `canCreateCampaign` and the guards of the submit handler, one message per gap. */
function getPendingItems(
  draft: CampaignCreationDraft,
  rewardCount: number,
  rewardsLoadError: string | null,
  planLoadError: string | null,
): PendingItem[] {
  const items: PendingItem[] = [];
  const titleError = getCampaignTitleError(draft.title);
  const summaryLength = draft.shortSummary.trim().length;

  if (!draft.campaignType) {
    items.push({ id: 'type', message: 'Elige el tipo de campaña.', step: 1 });
  }
  if (titleError) {
    items.push({ id: 'title', message: titleError, step: 2 });
  }
  if (!draft.category) {
    items.push({ id: 'category', message: 'Elige una categoría.', step: 2 });
  }
  if (!draft.location.trim()) {
    items.push({ id: 'location', message: 'Indica la ubicación.', step: 2 });
  }
  if (summaryLength < MIN_SHORT_SUMMARY_LENGTH || summaryLength > SHORT_SUMMARY_MAX_LENGTH) {
    items.push({
      id: 'summary',
      message: `El resumen debe tener entre ${MIN_SHORT_SUMMARY_LENGTH} y ${SHORT_SUMMARY_MAX_LENGTH} caracteres.`,
      step: 2,
    });
  }
  if (planLoadError) {
    items.push({ id: 'plan', message: 'Recupera el plan y presupuesto guardados.', step: 4 });
  }
  if (!draft.fundingModel) {
    items.push({ id: 'funding-model', message: 'Elige el modelo de financiamiento.', step: 5 });
  }
  if (
    draft.goalAmount === null ||
    draft.goalAmount < MIN_GOAL_AMOUNT ||
    draft.goalAmount > MAX_GOAL_AMOUNT
  ) {
    items.push({
      id: 'goal',
      message: `Define una meta entre ${formatBob(MIN_GOAL_AMOUNT)} y ${formatBob(MAX_GOAL_AMOUNT)}.`,
      step: 5,
    });
  }
  if (rewardsLoadError) {
    items.push({ id: 'rewards-load', message: 'Recupera las recompensas guardadas.', step: 6 });
  } else if (draft.campaignType === 'reward' && rewardCount === 0) {
    items.push({ id: 'rewards', message: 'Agrega al menos una recompensa.', step: 6 });
  }
  return items;
}

/** Each attach creates its own object URL, so a remount never reuses a revoked one. */
function UnsavedCoverImage({ file }: { file: File }) {
  const attach = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return;
      const url = URL.createObjectURL(file);
      img.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );
  return <img ref={attach} alt="Portada de la campaña" />;
}

function planTimeline(activities: CampaignPlanningDraft['activities']): string | null {
  const starts = activities.map((activity) => activity.startDate).filter(Boolean).sort();
  const ends = activities.map((activity) => activity.endDate).filter(Boolean).sort();
  if (starts.length === 0 || ends.length === 0) return null;
  return `${formatIsoDate(starts[0])} – ${formatIsoDate(ends[ends.length - 1])}`;
}

interface ReviewPanelProps {
  title: string;
  icon: ReactNode;
  aside?: ReactNode;
  editStep?: WizardStep;
  onEditStep?: (step: WizardStep) => void;
  children: ReactNode;
}

function ReviewPanel({ title, icon, aside, editStep, onEditStep, children }: ReviewPanelProps) {
  return (
    <section className="wizard-panel final-review__panel">
      <header className="final-review__panel-head">
        <h2 className="final-review__panel-title">
          {icon}
          {title}
        </h2>
        <div className="final-review__panel-aside">
          {aside}
          {editStep && onEditStep ? (
            <button
              type="button"
              className="wizard-link-btn final-review__edit"
              onClick={() => onEditStep(editStep)}
            >
              <Pencil size={14} aria-hidden="true" />
              Editar
            </button>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}

function TextOrMissing({ value, missing = 'Sin completar' }: { value: string; missing?: string }) {
  const text = value.trim();
  return text ? (
    <p className="final-review__text">{text}</p>
  ) : (
    <p className="final-review__missing">{missing}</p>
  );
}

export function StepFinalReview({
  draft,
  planning,
  pendingRewardIds,
  rewardsLoadError,
  isLoadingRewards = false,
  planLoadError = null,
  campaignStatus,
  kycStatus,
  coverImageUrl,
  isSubmitting,
  isDirty,
  createdCampaignId,
  submitError,
  saveFeedback,
  onPrevious,
  onSaveDraft,
  onSubmitReview,
  onEditStep,
}: StepFinalReviewProps) {
  const { rewards, activities, budgetItems } = planning;
  const canSubmit =
    canCreateCampaign(draft) &&
    !isSubmitting &&
    (campaignStatus === 'draft' ||
      campaignStatus === 'changes_requested' ||
      campaignStatus === null);

  const readOnlySubmitted =
    campaignStatus === 'pending_review' ||
    campaignStatus === 'approved' ||
    campaignStatus === 'published' ||
    campaignStatus === 'rejected';

  const editHandler = !readOnlySubmitted && !isSubmitting ? onEditStep : undefined;
  const unsavedCover = draft.coverImage;
  const typeLabel = labelOf(CAMPAIGN_TYPE_OPTIONS, draft.campaignType);
  const categoryLabel = labelOf(CAMPAIGN_CATEGORY_OPTIONS, draft.category);
  const fundingModel = FUNDING_MODEL_OPTIONS.find((option) => option.value === draft.fundingModel);
  const timeline = planTimeline(activities);
  const isRewardCampaign = draft.campaignType === 'reward';
  const pendingItems = getPendingItems(draft, rewards.length, rewardsLoadError, planLoadError);
  const kyc = kycStatus ? KYC_STATUS[kycStatus] : undefined;
  const missingStoryCount = STORY_FIELDS.filter((field) => !draft[field.key].trim()).length;

  return (
    <section className="wizard-wide final-review">
      <CampaignStepProgress step={8} />

      <div className="wizard-wide__layout">
        <CampaignCreationNav currentStep={8} />

        <div className="wizard-wide__content">
          <header className="wizard-wide__header final-review__header">
            <div>
              <h1>Revisión final</h1>
              <p>
                Confirma lo que enviarás a revisión. Se muestran los datos actuales del asistente,
                incluidos los cambios que aún no guardaste.
              </p>
            </div>
            <div className="final-review__header-badges">
              {campaignStatus ? (
                <Badge
                  variant={CAMPAIGN_STATUS_VARIANT[campaignStatus] ?? 'expired'}
                  label={CAMPAIGN_STATUS_LABELS[campaignStatus] ?? campaignStatus}
                />
              ) : (
                <Badge variant="expired" label="Aún no guardada" />
              )}
              {isDirty ? (
                <span className="wizard-chip wizard-chip--pending">Cambios sin guardar</span>
              ) : null}
            </div>
          </header>

          {pendingItems.length > 0 && !readOnlySubmitted ? (
            <div className="final-review__alert" role="status">
              <AlertTriangle size={18} aria-hidden="true" />
              <p>
                {pendingItems.length === 1
                  ? 'Hay 1 punto pendiente antes de enviar la campaña.'
                  : `Hay ${pendingItems.length} puntos pendientes antes de enviar la campaña.`}{' '}
                Revisa el detalle en «Verificación y datos pendientes».
              </p>
            </div>
          ) : null}

          <div className="final-review__sections">
            <section className="wizard-panel final-review__hero" aria-label="Información general">
              <div className="final-review__cover">
                {unsavedCover ? (
                  <UnsavedCoverImage file={unsavedCover} />
                ) : coverImageUrl ? (
                  <img src={coverImageUrl} alt="Portada de la campaña" />
                ) : (
                  <div className="final-review__cover-empty">
                    <ImageOff size={28} aria-hidden="true" />
                    <span>Sin portada</span>
                  </div>
                )}
                {unsavedCover ? (
                  <span className="wizard-chip wizard-chip--pending final-review__cover-chip">
                    Portada sin guardar
                  </span>
                ) : null}
              </div>

              <div className="final-review__hero-body">
                <div className="final-review__hero-top">
                  <div className="final-review__tags">
                    {typeLabel ? (
                      <span className="final-review__tag final-review__tag--strong">
                        {typeLabel}
                      </span>
                    ) : (
                      <span className="final-review__tag final-review__tag--missing">
                        Tipo sin definir
                      </span>
                    )}
                    {categoryLabel ? (
                      <span className="final-review__tag">{categoryLabel}</span>
                    ) : (
                      <span className="final-review__tag final-review__tag--missing">
                        Categoría sin definir
                      </span>
                    )}
                  </div>
                  {editHandler ? (
                    <button
                      type="button"
                      className="wizard-link-btn final-review__edit"
                      onClick={() => editHandler(2)}
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Editar
                    </button>
                  ) : null}
                </div>

                <h2 className="final-review__title">
                  {draft.title.trim() || <span className="final-review__missing">Sin título</span>}
                </h2>

                <p className="final-review__location">
                  <MapPin size={16} aria-hidden="true" />
                  {draft.location.trim() || (
                    <span className="final-review__missing">Ubicación sin definir</span>
                  )}
                </p>

                <TextOrMissing value={draft.shortSummary} missing="Sin resumen" />
              </div>
            </section>

            <ReviewPanel
              title="Historia e impacto"
              icon={<BookOpen size={18} aria-hidden="true" />}
              aside={
                missingStoryCount > 0 ? (
                  <span className="wizard-panel__count">
                    {missingStoryCount} sin completar
                  </span>
                ) : null
              }
              editStep={3}
              onEditStep={editHandler}
            >
              <dl className="final-review__story">
                {STORY_FIELDS.map((field) => (
                  <div key={field.key} className="final-review__story-item">
                    <dt>{field.label}</dt>
                    <dd>
                      <TextOrMissing value={draft[field.key]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </ReviewPanel>

            <ReviewPanel
              title="Plan y presupuesto"
              icon={<ClipboardList size={18} aria-hidden="true" />}
              editStep={4}
              onEditStep={editHandler}
            >
              {planLoadError ? (
                <p className="final-review__load-error" role="alert">
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>
                    {planLoadError} Recupéralo en el paso Plan y presupuesto antes de enviar.
                  </span>
                </p>
              ) : (
                <CampaignPlanBudgetView
                  activities={activities}
                  budgetItems={budgetItems.map((item) => ({
                    id: item.id,
                    category: item.category,
                    description: item.concept,
                    amount: item.amount,
                  }))}
                  goalAmount={draft.goalAmount}
                />
              )}
            </ReviewPanel>

            <ReviewPanel
              title="Financiamiento"
              icon={<Target size={18} aria-hidden="true" />}
              editStep={5}
              onEditStep={editHandler}
            >
              <dl className="final-review__facts">
                <div className="final-review__fact final-review__fact--highlight">
                  <dt>Meta</dt>
                  <dd>
                    {draft.goalAmount != null ? (
                      formatBob(draft.goalAmount)
                    ) : (
                      <span className="final-review__missing">Sin definir</span>
                    )}
                  </dd>
                </div>
                <div className="final-review__fact">
                  <dt>Moneda</dt>
                  <dd>Bolivianos (BOB)</dd>
                </div>
                <div className="final-review__fact">
                  <dt>Modelo</dt>
                  <dd>
                    {fundingModel ? (
                      <>
                        {fundingModel.title}
                        <span className="final-review__fact-hint">{fundingModel.description}</span>
                      </>
                    ) : (
                      <span className="final-review__missing">Sin definir</span>
                    )}
                  </dd>
                </div>
                <div className="final-review__fact">
                  <dt>Cronograma del plan</dt>
                  <dd>
                    {planLoadError ? (
                      <span className="final-review__missing">No disponible: el plan no cargó</span>
                    ) : (
                      (timeline ?? <span className="final-review__missing">Sin actividades</span>)
                    )}
                  </dd>
                </div>
              </dl>
            </ReviewPanel>

            <ReviewPanel
              title="Recompensas"
              icon={<Gift size={18} aria-hidden="true" />}
              aside={
                isRewardCampaign && !rewardsLoadError && !isLoadingRewards ? (
                  <span className="wizard-panel__count">
                    {rewards.length} {rewards.length === 1 ? 'recompensa' : 'recompensas'}
                  </span>
                ) : null
              }
              editStep={isRewardCampaign ? 6 : undefined}
              onEditStep={editHandler}
            >
              {!isRewardCampaign ? (
                <p className="wizard-panel__empty">
                  No aplica: la campaña es de tipo {typeLabel ?? 'sin definir'}.
                </p>
              ) : rewardsLoadError ? (
                <p className="final-review__load-error" role="alert">
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>
                    {rewardsLoadError} Recupéralas en el paso Recompensas antes de enviar.
                  </span>
                </p>
              ) : isLoadingRewards ? (
                <p className="wizard-panel__empty">Cargando recompensas guardadas…</p>
              ) : rewards.length === 0 ? (
                <p className="wizard-panel__empty">
                  Aún no agregaste recompensas. Necesitas al menos una guardada para enviar la
                  campaña a revisión.
                </p>
              ) : (
                <>
                  <ul className="final-review__rewards">
                    {rewards.map((reward) => (
                      <li key={reward.id} className="final-review__reward">
                        <div className="final-review__reward-head">
                          <p className="final-review__reward-title">{reward.title}</p>
                          {pendingRewardIds.has(reward.id) ? (
                            <span className="wizard-chip wizard-chip--pending">Sin guardar</span>
                          ) : null}
                        </div>
                        <p className="final-review__reward-amount">
                          Desde {formatBob(reward.minimumContribution)}
                        </p>
                        <p className="final-review__text final-review__reward-desc">
                          {reward.description}
                        </p>
                        <div className="final-review__reward-meta">
                          <span>
                            <Users size={14} aria-hidden="true" />
                            {describeRewardSlots(reward)}
                          </span>
                          <span>
                            <Calendar size={14} aria-hidden="true" />
                            Entrega estimada: {formatIsoDate(reward.estimatedDelivery)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {pendingRewardIds.size > 0 ? (
                    <p className="wizard-note wizard-note--warning">
                      Hay recompensas sin guardar: se guardarán antes de enviar a revisión.
                    </p>
                  ) : null}
                </>
              )}
            </ReviewPanel>

            <ReviewPanel
              title="Verificación y datos pendientes"
              icon={<ShieldCheck size={18} aria-hidden="true" />}
            >
              <dl className="final-review__facts">
                <div className="final-review__fact">
                  <dt>Verificación KYC</dt>
                  <dd>
                    <Badge
                      variant={kyc?.variant ?? 'expired'}
                      label={kyc?.label ?? (kycStatus || 'Desconocido')}
                    />
                  </dd>
                </div>
                <div className="final-review__fact">
                  <dt>Estado de la campaña</dt>
                  <dd>
                    {campaignStatus
                      ? (CAMPAIGN_STATUS_LABELS[campaignStatus] ?? campaignStatus)
                      : 'Aún no guardada'}
                  </dd>
                </div>
              </dl>

              {readOnlySubmitted ? null : pendingItems.length === 0 ? (
                <p className="final-review__ready">
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Los datos obligatorios están completos.
                </p>
              ) : (
                <ul className="final-review__pending">
                  {pendingItems.map((item) => (
                    <li key={item.id}>
                      <AlertTriangle size={16} aria-hidden="true" />
                      <span>{item.message}</span>
                      {editHandler ? (
                        <button
                          type="button"
                          className="wizard-link-btn"
                          onClick={() => editHandler(item.step)}
                        >
                          Ir al paso
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </ReviewPanel>
          </div>

          <div className="wizard-wide__actions">
            <Button variant="tertiary" onClick={onPrevious} disabled={isSubmitting}>
              Atrás
            </Button>
            <div className="wizard-wide__actions-right">
              {!readOnlySubmitted ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={onSaveDraft}
                    disabled={isSubmitting || (!!createdCampaignId && !isDirty)}
                  >
                    {isSubmitting ? 'Guardando…' : 'Guardar borrador'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={onSubmitReview}
                    disabled={!canSubmit}
                  >
                    {isDirty ? 'Guardar y enviar a revisión' : 'Enviar a revisión'}
                  </Button>
                </>
              ) : (
                <Button variant="primary" disabled>
                  Enviada / no editable
                </Button>
              )}
            </div>
          </div>

          {submitError ? (
            <p className="final-review__feedback final-review__feedback--error" role="alert">
              {submitError}
            </p>
          ) : null}
          {saveFeedback === 'submitted' ? (
            <p className="final-review__feedback">Campaña enviada a revisión.</p>
          ) : saveFeedback === 'updated' || saveFeedback === 'created' ? (
            <p className="final-review__feedback">Borrador guardado.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
