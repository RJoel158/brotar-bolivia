import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  ImageOff,
  MapPin,
  ShieldCheck,
  Sprout,
  X,
  XCircle,
} from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  campaignsApi,
  type CampaignResponse,
  type CampaignReviewHistoryItem,
  type CampaignReviewSectionNotes,
  type CampaignRewardResponse,
  type CampaignStatus,
} from '../../../shared/api/campaignsApi.ts';
import { Button } from '../../../shared/components/Button.tsx';
import { formatCurrency, formatPercentage } from '../../../shared/index.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { CAMPAIGN_STATUS_LABELS } from '../../campaigns/campaignStatusLabels.ts';
import { CampaignPlanBudgetView } from '../../campaigns/components/CampaignPlanBudgetView.tsx';
import { useCampaignPlan } from '../../campaigns/hooks/useCampaignPlan.ts';
import {
  CAMPAIGN_CATEGORY_OPTIONS,
  CAMPAIGN_TYPE_OPTIONS,
  FUNDING_MODEL_OPTIONS,
} from '../../creator/campaign-creation/types.ts';
import { formatIsoDate } from '../../creator/campaign-creation/planningValidation.ts';
import { useCampaignRewards } from '../../campaigns/hooks/useCampaignRewards.ts';
import { LoadErrorNotice } from './LoadErrorNotice.tsx';

export interface CampaignReviewDrawerProps {
  campaign: CampaignResponse;
  /** `campaign` viene del servidor en este momento, no de la cola ya listada. */
  isDetailFresh: boolean;
  detailRefreshError: string | null;
  onRetryDetailRefresh: () => void;
  onClose: () => void;
  onCampaignUpdated: (updated: CampaignResponse) => void;
  onQueueShouldRefresh: () => void;
}

type ReviewAction = 'approve' | 'requestChanges' | 'reject' | 'publish';
type ActionMode = 'none' | 'requestChanges' | 'reject';

interface ConfirmState {
  action: ReviewAction;
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'approve' | 'requires_docs' | 'reject' | 'publish';
  notes?: string;
  rejectionReason?: string;
  sectionNotes?: CampaignReviewSectionNotes;
}

const SECTION_NOTE_FIELDS: Array<{ key: keyof CampaignReviewSectionNotes; label: string }> = [
  { key: 'cover', label: 'Portada' },
  { key: 'generalInfo', label: 'Información general' },
  { key: 'storyImpact', label: 'Historia e impacto' },
  { key: 'planBudget', label: 'Plan y presupuesto' },
  { key: 'funding', label: 'Financiamiento' },
  { key: 'rewards', label: 'Recompensas' },
  { key: 'other', label: 'Otras observaciones' },
];

function rewardSlotsLabel(reward: CampaignRewardResponse): string {
  if (reward.quantityTotal === null) {
    return `Ilimitados · ${reward.quantityClaimed} adjudicados`;
  }
  return `${reward.quantityRemaining ?? 0} disponibles de ${reward.quantityTotal} · ${reward.quantityClaimed} adjudicados`;
}

const REVIEW_ACTION_LABELS: Record<CampaignReviewHistoryItem['action'], string> = {
  approved: 'Aprobada',
  rejected: 'Rechazada',
  changes_requested: 'Cambios solicitados',
};

function emptySectionNotes(): CampaignReviewSectionNotes {
  return {
    cover: '',
    generalInfo: '',
    storyImpact: '',
    planBudget: '',
    funding: '',
    rewards: '',
    other: '',
  };
}

function hasAnySectionNote(notes: CampaignReviewSectionNotes): boolean {
  return Object.values(notes).some((value) => typeof value === 'string' && value.trim().length > 0);
}

function cleanSectionNotes(notes: CampaignReviewSectionNotes): CampaignReviewSectionNotes {
  const cleaned: CampaignReviewSectionNotes = {};
  for (const [key, value] of Object.entries(notes) as Array<
    [keyof CampaignReviewSectionNotes, string | undefined]
  >) {
    const trimmed = value?.trim();
    if (trimmed) cleaned[key] = trimmed;
  }
  return cleaned;
}

function labelOf(
  options: ReadonlyArray<{ value: string; label?: string; title?: string }>,
  value: string | null | undefined,
): string {
  if (!value) return '—';
  const found = options.find((o) => o.value === value);
  return found?.label ?? found?.title ?? value;
}

function CampaignStatusBadge({ status }: { status: string }) {
  const label = CAMPAIGN_STATUS_LABELS[status] ?? status;
  return <span className={`campaign-status-badge status-${status}`}>{label}</span>;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="detail-field-item">
      <span className="field-label">
        <span>{label}</span>
      </span>
      <span className="field-value">{value || '—'}</span>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="campaign-review-text-block">
      <h4>{label}</h4>
      <p>{value?.trim() ? value : 'Sin información registrada.'}</p>
    </div>
  );
}

export const CampaignReviewDrawer: FC<CampaignReviewDrawerProps> = ({
  campaign: initialCampaign,
  isDetailFresh,
  detailRefreshError,
  onRetryDetailRefresh,
  onClose,
  onCampaignUpdated,
  onQueueShouldRefresh,
}) => {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [isActing, setIsActing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>('none');
  const [notesInput, setNotesInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [sectionNotes, setSectionNotes] = useState<CampaignReviewSectionNotes>(emptySectionNotes);
  const [history, setHistory] = useState<CampaignReviewHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const {
    plan,
    isLoading: planLoading,
    error: planError,
  } = useCampaignPlan(initialCampaign.id);
  const isRewardCampaign = campaign.campaignType === 'reward';
  const {
    rewards,
    isLoading: rewardsLoading,
    error: rewardsError,
    reload: reloadRewards,
  } = useCampaignRewards(initialCampaign.id, isRewardCampaign);
  const decisionsLocked = isActing || !isDetailFresh;
  const noteFields = SECTION_NOTE_FIELDS.filter(
    ({ key }) => key !== 'rewards' || isRewardCampaign,
  );

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const items = await campaignsApi.listReviews(initialCampaign.id);
      setHistory(items);
    } catch (err) {
      setHistoryError(getApiErrorMessage(err, 'No se pudo cargar el historial de revisiones.'));
    } finally {
      setHistoryLoading(false);
    }
  }, [initialCampaign.id]);

  useEffect(() => {
    setCampaign(initialCampaign);
  }, [initialCampaign]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDialog) {
        setConfirmDialog(null);
      } else if (actionMode !== 'none') {
        setActionMode('none');
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, confirmDialog, actionMode]);

  const status = campaign.status as CampaignStatus | string;

  const openConfirm = (
    action: ReviewAction,
    payload?: {
      notes?: string;
      rejectionReason?: string;
      sectionNotes?: CampaignReviewSectionNotes;
    },
  ) => {
    const map: Record<ReviewAction, ConfirmState> = {
      approve: {
        action: 'approve',
        title: 'Aprobar campaña',
        message:
          'Esta campaña pasará al estado aprobado y podrá continuar al proceso de publicación.',
        confirmLabel: 'Aprobar',
        tone: 'approve',
      },
      requestChanges: {
        action: 'requestChanges',
        title: 'Solicitar cambios',
        message: 'El creador recibirá tus notas por sección y deberá corregir la campaña.',
        confirmLabel: 'Solicitar cambios',
        tone: 'requires_docs',
        notes: payload?.notes,
        sectionNotes: payload?.sectionNotes,
      },
      reject: {
        action: 'reject',
        title: 'Rechazar campaña',
        message: 'Se guardará el motivo oficial de rechazo en el historial.',
        confirmLabel: 'Rechazar',
        tone: 'reject',
        rejectionReason: payload?.rejectionReason,
      },
      publish: {
        action: 'publish',
        title: 'Publicar campaña',
        message:
          'La campaña quedará visible públicamente en la plataforma con estado publicada.',
        confirmLabel: 'Publicar',
        tone: 'publish',
      },
    };
    setConfirmDialog(map[action]);
  };

  const handleRequestChangesContinue = () => {
    if (!hasAnySectionNote(sectionNotes) && !notesInput.trim()) return;
    openConfirm('requestChanges', {
      notes: notesInput.trim() || undefined,
      sectionNotes: cleanSectionNotes(sectionNotes),
    });
  };

  const handleRejectContinue = () => {
    if (!rejectionReasonInput.trim()) return;
    openConfirm('reject', { rejectionReason: rejectionReasonInput.trim() });
  };

  const executeAction = async () => {
    if (!confirmDialog || decisionsLocked) return;
    const { action, notes, rejectionReason, sectionNotes: confirmSectionNotes } = confirmDialog;
    setConfirmDialog(null);
    setIsActing(true);
    setError(null);
    setFeedback(null);

    try {
      let updated: CampaignResponse;
      if (action === 'approve') {
        updated = await campaignsApi.approve(campaign.id);
        setFeedback('Campaña aprobada correctamente.');
      } else if (action === 'reject') {
        updated = await campaignsApi.reject(campaign.id, {
          rejectionReason: rejectionReason || rejectionReasonInput.trim(),
        });
        setFeedback('Campaña rechazada correctamente.');
      } else if (action === 'requestChanges') {
        updated = await campaignsApi.requestChanges(campaign.id, {
          notes: notes || notesInput.trim() || undefined,
          sectionNotes: confirmSectionNotes || cleanSectionNotes(sectionNotes),
        });
        setFeedback('Se solicitaron cambios al creador.');
      } else {
        updated = await campaignsApi.publish(campaign.id);
        setFeedback('Campaña publicada correctamente.');
      }
      setCampaign(updated);
      onCampaignUpdated(updated);
      onQueueShouldRefresh();
      setActionMode('none');
      setNotesInput('');
      setRejectionReasonInput('');
      setSectionNotes(emptySectionNotes());
      await loadHistory();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo completar la acción.'));
    } finally {
      setIsActing(false);
    }
  };

  const progressLabel = formatPercentage(campaign.currentAmount, campaign.goalAmount);

  return (
    <>
      <div className="slide-over-backdrop" onClick={onClose}>
        <aside
          className="slide-over-panel campaign-review-panel"
          onClick={(e) => e.stopPropagation()}
          aria-label="Revisión de campaña"
        >
          <div className="slide-over-header campaign-review-header">
            <div className="campaign-review-header-main">
              <div className="campaign-review-header-icon" aria-hidden>
                <Sprout size={22} />
              </div>
              <div>
                <h2 className="user-header-name">{campaign.title}</h2>
                <div className="user-header-tags">
                  <CampaignStatusBadge status={status} />
                  <span className="campaign-meta-chip">
                    {labelOf(CAMPAIGN_CATEGORY_OPTIONS, campaign.category)}
                  </span>
                  <span className="campaign-meta-chip">
                    {labelOf(CAMPAIGN_TYPE_OPTIONS, campaign.campaignType)}
                  </span>
                </div>
                {campaign.location ? (
                  <span className="user-header-email campaign-location-line">
                    <MapPin size={13} />
                    {campaign.location}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              title="Cerrar panel (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          <div className="slide-over-body campaign-review-body">
            <section className="campaign-review-section">
              <div className="detail-section-title">Portada</div>
              {campaign.coverImageUrl ? (
                <div className="campaign-review-cover">
                  <img src={campaign.coverImageUrl} alt={`Portada de ${campaign.title}`} />
                </div>
              ) : (
                <div className="campaign-review-cover campaign-review-cover--empty">
                  <ImageOff size={28} />
                  <span>Sin imagen de portada</span>
                </div>
              )}
            </section>

            <section className="campaign-review-section">
              <div className="detail-section-title">Información general</div>
              <div className="detail-field-list">
                <Field label="Título" value={campaign.title} />
                <Field label="Resumen" value={campaign.shortSummary} />
                <Field
                  label="Categoría"
                  value={labelOf(CAMPAIGN_CATEGORY_OPTIONS, campaign.category)}
                />
                <Field
                  label="Tipo de campaña"
                  value={labelOf(CAMPAIGN_TYPE_OPTIONS, campaign.campaignType)}
                />
                <Field label="Ubicación" value={campaign.location} />
                <Field
                  label="Creador"
                  value={campaign.creatorName?.trim() || 'Nombre no disponible'}
                />
                {campaign.organizationName?.trim() ? (
                  <Field label="Organización" value={campaign.organizationName} />
                ) : null}
                <Field
                  label="ID propietario"
                  value={<code className="campaign-owner-id">{campaign.ownerUserId}</code>}
                />
                <Field
                  label="Actualizado"
                  value={new Date(campaign.updatedAt).toLocaleString('es-BO')}
                />
              </div>
            </section>

            <section className="campaign-review-section">
              <div className="detail-section-title">Historia e impacto</div>
              <TextBlock label="Problema" value={campaign.problem} />
              <TextBlock label="Solución" value={campaign.solution} />
              <TextBlock label="Beneficiarios" value={campaign.beneficiaries} />
              <TextBlock label="Impacto esperado" value={campaign.expectedImpact} />
              <TextBlock label="Indicadores de impacto" value={campaign.impactIndicators} />
            </section>

            <section className="campaign-review-section">
              <div className="detail-section-title">Plan y presupuesto</div>
              {planLoading ? (
                <p className="campaign-review-history-empty">Cargando plan y presupuesto…</p>
              ) : planError ? (
                <LoadErrorNotice summary="No se pudo cargar el plan y presupuesto." error={planError} />
              ) : plan ? (
                <CampaignPlanBudgetView
                  activities={plan.activities}
                  budgetItems={plan.budgetItems}
                  goalAmount={campaign.goalAmount}
                  currency={campaign.currency || 'BOB'}
                />
              ) : (
                <p className="campaign-review-history-empty">Sin plan y presupuesto registrados.</p>
              )}
            </section>

            <section className="campaign-review-section">
              <div className="detail-section-title">Financiamiento</div>
              <div className="detail-field-list">
                <Field
                  label="Meta"
                  value={formatCurrency(campaign.goalAmount, campaign.currency || 'BOB')}
                />
                <Field
                  label="Recaudado"
                  value={formatCurrency(campaign.currentAmount, campaign.currency || 'BOB')}
                />
                <Field label="Progreso" value={`${progressLabel}%`} />
                <Field
                  label="Modelo"
                  value={labelOf(
                    FUNDING_MODEL_OPTIONS.map((o) => ({ value: o.value, title: o.title })),
                    campaign.fundingModel,
                  )}
                />
                <Field label="Moneda" value={campaign.currency || 'BOB'} />
                <Field
                  label="Inicio"
                  value={
                    campaign.startDate
                      ? new Date(campaign.startDate).toLocaleDateString('es-BO')
                      : null
                  }
                />
                <Field
                  label="Fin"
                  value={
                    campaign.endDate
                      ? new Date(campaign.endDate).toLocaleDateString('es-BO')
                      : null
                  }
                />
              </div>
            </section>

            {isRewardCampaign ? (
              <section className="campaign-review-section">
                <div className="detail-section-title">Recompensas</div>
                {rewardsLoading ? (
                  <p className="campaign-review-history-empty">Cargando recompensas…</p>
                ) : rewardsError ? (
                  <LoadErrorNotice
                    summary="No se pudieron cargar las recompensas."
                    error={rewardsError}
                    onRetry={reloadRewards}
                  />
                ) : rewards.length === 0 ? (
                  <p className="campaign-review-history-empty">
                    La campaña no tiene recompensas guardadas.
                  </p>
                ) : (
                  rewards.map((reward) => (
                    <div key={reward.id} className="campaign-review-text-block">
                      <h4>
                        {reward.title} · desde{' '}
                        {formatCurrency(reward.minimumContribution, reward.currency)}
                        {reward.isActive ? '' : ' · deshabilitada'}
                      </h4>
                      <p>{reward.description}</p>
                      <p>
                        Cupos: {rewardSlotsLabel(reward)} · Entrega estimada:{' '}
                        {formatIsoDate(reward.estimatedDeliveryOn)}
                      </p>
                    </div>
                  ))
                )}
              </section>
            ) : null}

            <section className="campaign-review-section">
              <div className="detail-section-title">
                <History size={15} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                Historial de revisiones
              </div>
              {historyLoading ? (
                <p className="campaign-review-history-empty">Cargando historial…</p>
              ) : null}
              {historyError ? (
                <LoadErrorNotice
                  summary="No se pudo cargar el historial de revisiones."
                  error={historyError}
                  onRetry={() => void loadHistory()}
                />
              ) : null}
              {!historyLoading && !historyError && history.length === 0 ? (
                <p className="campaign-review-history-empty">
                  Aún no hay revisiones registradas para esta campaña.
                </p>
              ) : null}
              {!historyLoading && history.length > 0 ? (
                <ul className="campaign-review-history-list">
                  {history.map((item) => (
                    <li key={item.id} className={`campaign-review-history-item action-${item.action}`}>
                      <div className="campaign-review-history-head">
                        <strong>{REVIEW_ACTION_LABELS[item.action]}</strong>
                        <time dateTime={item.createdAt}>
                          {new Date(item.createdAt).toLocaleString('es-BO')}
                        </time>
                      </div>
                      <p className="campaign-review-history-reviewer">
                        {item.reviewerFullName || 'Revisor'}
                        {item.reviewerEmail ? ` · ${item.reviewerEmail}` : ''}
                      </p>
                      {item.reason ? (
                        <p className="campaign-review-history-reason">
                          <span>Detalle:</span> {item.reason}
                        </p>
                      ) : null}
                      {item.sectionNotes ? (
                        <ul className="campaign-review-history-notes">
                          {SECTION_NOTE_FIELDS.map(({ key, label }) => {
                            const note = item.sectionNotes?.[key];
                            if (!note) return null;
                            return (
                              <li key={key}>
                                <strong>{label}:</strong> {note}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="campaign-review-section">
              <div className="detail-section-title">Estado</div>
              <div className="campaign-review-status-card">
                <CampaignStatusBadge status={status} />
                {status === 'changes_requested' ? (
                  <p>Esperando correcciones del creador.</p>
                ) : null}
                {status === 'rejected' ? (
                  <p>La campaña fue rechazada y no admite más acciones de revisión.</p>
                ) : null}
                {status === 'published' ? (
                  <p>La campaña ya está publicada en la plataforma.</p>
                ) : null}
                {status === 'approved' ? (
                  <p>Aprobada. Lista para publicación.</p>
                ) : null}
                {status === 'pending_review' ? (
                  <p>Pendiente de evaluación administrativa.</p>
                ) : null}
                {campaign.reviewNotes ? (
                  <div className="campaign-review-comment-box">
                    <strong>Observaciones del admin</strong>
                    <p>{campaign.reviewNotes}</p>
                  </div>
                ) : null}
                {campaign.reviewRejectionReason ? (
                  <div className="campaign-review-comment-box campaign-review-comment-box--danger">
                    <strong>Motivo de rechazo</strong>
                    <p>{campaign.reviewRejectionReason}</p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="campaign-review-section campaign-review-decision">
              <div className="detail-section-title">Decisión de revisión</div>

              {!isDetailFresh && !detailRefreshError ? (
                <p className="campaign-review-history-empty" role="status">
                  Actualizando datos de la campaña… Las decisiones se habilitan al confirmar su
                  estado actual.
                </p>
              ) : null}
              {detailRefreshError ? (
                <LoadErrorNotice
                  summary="No se pudo confirmar el estado actual de la campaña. Las decisiones siguen bloqueadas."
                  error={detailRefreshError}
                  onRetry={onRetryDetailRefresh}
                />
              ) : null}

              {feedback ? (
                <div className="campaign-review-action-result" role="status">
                  <CheckCircle2 size={16} />
                  <span>{feedback}</span>
                </div>
              ) : null}
              {error ? (
                <div
                  className="campaign-review-action-result campaign-review-action-result--error"
                  role="alert"
                >
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              ) : null}

              {status === 'pending_review' ? (
                <div className="campaign-decision-grid">
                  <div className="audit-decision-card approve">
                    <div className="decision-header">
                      <div className="decision-icon-badge approve">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="decision-title-block">
                        <h4>Aprobar campaña</h4>
                        <p>Habilita la campaña para el proceso de publicación.</p>
                      </div>
                    </div>
                    <div className="decision-action-wrap">
                      <button
                        type="button"
                        className="audit-btn btn-approve-solid"
                        disabled={decisionsLocked}
                        onClick={() => openConfirm('approve')}
                      >
                        Aprobar campaña
                      </button>
                    </div>
                  </div>

                  <div
                    className={`audit-decision-card request-docs ${actionMode === 'requestChanges' ? 'is-active' : ''}`}
                  >
                    <div className="decision-header">
                      <div className="decision-icon-badge request-docs">
                        <Clock size={18} />
                      </div>
                      <div className="decision-title-block">
                        <h4>Solicitar cambios</h4>
                        <p>Envía observaciones específicas para que el creador corrija la campaña.</p>
                      </div>
                    </div>
                    {actionMode === 'requestChanges' ? (
                      <div className="decision-interactive-form">
                        <label className="form-input-label">Notas por sección:</label>
                        <div className="campaign-review-section-notes">
                          {noteFields.map(({ key, label }) => (
                            <label key={key} className="campaign-review-form-field">
                              <span>{label}</span>
                              <textarea
                                rows={3}
                                className="audit-textarea warning"
                                placeholder={`Observaciones de ${label.toLowerCase()}`}
                                value={sectionNotes[key] ?? ''}
                                onChange={(e) =>
                                  setSectionNotes((prev) => ({ ...prev, [key]: e.target.value }))
                                }
                                disabled={isActing}
                              />
                            </label>
                          ))}
                        </div>
                        <label className="form-input-label">Observación general (opcional):</label>
                        <textarea
                          rows={3}
                          className="audit-textarea warning"
                          placeholder="Comentario adicional si hace falta."
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          disabled={isActing}
                        />
                        <div className="form-actions-row">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setActionMode('none');
                              setSectionNotes(emptySectionNotes());
                              setNotesInput('');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleRequestChangesContinue}
                            disabled={
                              (!hasAnySectionNote(sectionNotes) && !notesInput.trim()) ||
                              decisionsLocked
                            }
                          >
                            Continuar →
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="decision-action-wrap">
                        <button
                          type="button"
                          className="audit-btn btn-request-docs-solid"
                          disabled={isActing}
                          onClick={() => {
                            setActionMode('requestChanges');
                            setRejectionReasonInput('');
                          }}
                        >
                          Solicitar cambios
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={`audit-decision-card reject ${actionMode === 'reject' ? 'is-active' : ''}`}>
                    <div className="decision-header">
                      <div className="decision-icon-badge reject">
                        <XCircle size={18} />
                      </div>
                      <div className="decision-title-block">
                        <h4>Rechazar campaña</h4>
                        <p>Deniega la campaña e indica el motivo oficial de rechazo.</p>
                      </div>
                    </div>
                    {actionMode === 'reject' ? (
                      <div className="decision-interactive-form">
                        <label className="form-input-label">Motivo oficial de rechazo:</label>
                        <textarea
                          rows={5}
                          className="audit-textarea danger"
                          placeholder="Ej. El proyecto no cumple los requisitos de impacto ambiental de la plataforma."
                          value={rejectionReasonInput}
                          onChange={(e) => setRejectionReasonInput(e.target.value)}
                          disabled={isActing}
                          autoFocus
                        />
                        <div className="form-actions-row">
                          <Button variant="ghost" size="sm" onClick={() => setActionMode('none')}>
                            Cancelar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-reject-confirm"
                            onClick={handleRejectContinue}
                            disabled={!rejectionReasonInput.trim() || decisionsLocked}
                          >
                            Continuar →
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="decision-action-wrap">
                        <button
                          type="button"
                          className="audit-btn btn-reject-outline"
                          disabled={isActing}
                          onClick={() => {
                            setActionMode('reject');
                            setNotesInput('');
                          }}
                        >
                          Rechazar campaña
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {status === 'approved' ? (
                <div className="campaign-decision-grid">
                  <div className="audit-decision-card approve is-current">
                    <div className="decision-header">
                      <div className="decision-icon-badge approve">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="decision-title-block">
                        <h4>Publicar campaña</h4>
                        <p>Hace visible la campaña para el público en Brotar.</p>
                      </div>
                    </div>
                    <div className="decision-action-wrap">
                      <button
                        type="button"
                        className="audit-btn btn-approve-solid"
                        disabled={decisionsLocked}
                        onClick={() => openConfirm('publish')}
                      >
                        {isActing ? 'Publicando…' : 'Publicar campaña'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {status !== 'pending_review' && status !== 'approved' ? (
                <div className="campaign-review-readonly-note">
                  No hay acciones disponibles para este estado.
                </div>
              ) : null}
            </section>
          </div>

          <div className="slide-over-footer" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="action-btn secondary btn-close-drawer" onClick={onClose}>
              Cerrar panel
            </button>
          </div>
        </aside>
      </div>

      {confirmDialog ? (
        <div
          className="kyc-confirm-dialog-backdrop"
          onClick={() => (isActing ? undefined : setConfirmDialog(null))}
        >
          <div className="kyc-confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-header-row">
              <div
                className={`confirm-icon-box ${
                  confirmDialog.tone === 'publish' ? 'approve' : confirmDialog.tone
                }`}
              >
                {confirmDialog.tone === 'approve' || confirmDialog.tone === 'publish' ? (
                  <ShieldCheck size={24} />
                ) : null}
                {confirmDialog.tone === 'requires_docs' ? <AlertTriangle size={24} /> : null}
                {confirmDialog.tone === 'reject' ? <XCircle size={24} /> : null}
              </div>
              <div className="confirm-title-wrap">
                <h3 className="confirm-title">{confirmDialog.title}</h3>
                <p className="confirm-message">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="confirm-actions-row">
              <button
                type="button"
                className="confirm-btn cancel"
                disabled={isActing}
                onClick={() => setConfirmDialog(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`confirm-btn submit ${
                  confirmDialog.tone === 'publish' ? 'approve' : confirmDialog.tone
                }`}
                disabled={decisionsLocked}
                onClick={() => void executeAction()}
              >
                {isActing ? 'Procesando…' : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
