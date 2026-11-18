import { useRef, type ChangeEvent } from 'react';
import { Button, Input } from '../../../../shared/index.ts';
import { CampaignCreationNav } from '../components/CampaignCreationNav.tsx';
import { CampaignStepProgress } from '../components/CampaignStepProgress.tsx';
import { useItemEditor } from '../hooks/useItemEditor.ts';
import {
  EMPTY_REWARD_FORM,
  MAX_REWARD_QUANTITY,
  blockNonIntegerKeys,
  createLocalId,
  formatBob,
  formatIsoDate,
  describeRewardSlots,
  todayLaPazIsoDate,
  validateReward,
  type RewardQuantityMode,
} from '../planningValidation.ts';
import {
  CAMPAIGN_TYPE_OPTIONS,
  type CampaignPlanningDraft,
  type CampaignReward,
  type CampaignTypeValue,
} from '../types.ts';
import '../components/WizardPanel.css';

export interface StepRewardsProps {
  campaignType: CampaignTypeValue | null;
  rewards: CampaignPlanningDraft['rewards'];
  /** New or edited rewards not yet confirmed by the API. */
  pendingRewardIds: ReadonlySet<string>;
  /** Rewards already stored. Only those can be activated or deactivated. */
  persistedRewardIds: ReadonlySet<string>;
  togglingRewardId: string | null;
  onToggleActive: (rewardId: string, isActive: boolean) => void;
  hasPendingChanges: boolean;
  isLoading: boolean;
  loadError: string | null;
  onRetryLoad?: () => void;
  disableEdit: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  saveFeedback: 'created' | 'updated' | null;
  onSave: () => void;
  onChange: (patch: Partial<CampaignPlanningDraft>) => void;
  onChangeCampaignType: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const QUANTITY_MODE_OPTIONS: ReadonlyArray<{ value: RewardQuantityMode; label: string }> = [
  { value: 'limited', label: 'Cupos limitados' },
  { value: 'unlimited', label: 'Cupos ilimitados' },
];

function typeLabel(type: CampaignTypeValue | null): string {
  return CAMPAIGN_TYPE_OPTIONS.find((option) => option.value === type)?.title ?? 'sin definir';
}

export function StepRewards({
  campaignType,
  rewards,
  pendingRewardIds,
  persistedRewardIds,
  togglingRewardId,
  onToggleActive,
  hasPendingChanges,
  isLoading,
  loadError,
  onRetryLoad,
  disableEdit,
  isSubmitting,
  submitError,
  saveFeedback,
  onSave,
  onChange,
  onChangeCampaignType,
  onNext,
  onPrevious,
}: StepRewardsProps) {
  const savedDeliveryRef = useRef<string | null>(null);
  const editor = useItemEditor(EMPTY_REWARD_FORM, (values) =>
    validateReward(values, savedDeliveryRef.current),
  );
  const appliesToCampaign = campaignType === 'reward';

  const resetEditor = () => {
    savedDeliveryRef.current = null;
    editor.reset();
  };

  const saveReward = () => {
    if (disableEdit) return;
    editor.submit((values, editingId) => {
      savedDeliveryRef.current = null;
      const previous = editingId ? rewards.find((item) => item.id === editingId) : undefined;
      const reward: CampaignReward = {
        id: editingId ?? createLocalId(),
        title: values.title.trim(),
        description: values.description.trim(),
        minimumContribution: Number(values.minimumContribution),
        availableQuantity:
          values.quantityMode === 'unlimited' ? null : Number(values.availableQuantity),
        quantityClaimed: previous?.quantityClaimed ?? 0,
        isActive: previous?.isActive ?? true,
        estimatedDelivery: values.estimatedDelivery,
      };
      onChange({
        rewards: editingId
          ? rewards.map((item) => (item.id === editingId ? reward : item))
          : [...rewards, reward],
      });
    });
  };

  const removeReward = (id: string) => {
    if (disableEdit) return;
    if (editor.editingId === id) {
      resetEditor();
    }
    onChange({ rewards: rewards.filter((item) => item.id !== id) });
  };

  const startEdit = (reward: CampaignReward) => {
    savedDeliveryRef.current = reward.estimatedDelivery;
    editor.startEdit(reward.id, {
      title: reward.title,
      description: reward.description,
      minimumContribution: String(reward.minimumContribution),
      quantityMode: reward.availableQuantity === null ? 'unlimited' : 'limited',
      availableQuantity: reward.availableQuantity === null ? '' : String(reward.availableQuantity),
      estimatedDelivery: reward.estimatedDelivery,
    });
  };

  const changeQuantityMode = (mode: RewardQuantityMode) => {
    editor.setField('quantityMode', mode);
    if (mode === 'unlimited') {
      editor.setField('availableQuantity', '');
    }
  };

  const descriptionError = editor.errors.description;

  return (
    <section className="wizard-wide">
      <CampaignStepProgress step={6} />

      <div className="wizard-wide__layout">
        <CampaignCreationNav currentStep={6} />

        <div className="wizard-wide__content">
          <header className="wizard-wide__header">
            <h1>Recompensas</h1>
            <p>Configura los incentivos para quienes apoyen tu campaña.</p>
          </header>

          {isLoading ? (
            <p className="wizard-panel__empty">Cargando recompensas guardadas…</p>
          ) : loadError ? (
            <div className="wizard-notice" role="alert">
              <p>{loadError}</p>
              <p>No puedes editar recompensas hasta recuperarlas, para no perder las guardadas.</p>
              {onRetryLoad ? (
                <div className="wizard-notice__actions">
                  <Button variant="secondary" onClick={onRetryLoad}>
                    Reintentar
                  </Button>
                </div>
              ) : null}
            </div>
          ) : !appliesToCampaign ? (
            <div className="wizard-notice">
              <p>
                Las recompensas aplican a campañas de tipo <strong>Recompensa</strong>. Tu campaña
                es de tipo <strong>{typeLabel(campaignType)}</strong>, por lo que puedes continuar
                sin configurar este paso.
              </p>
              {rewards.length > 0 ? (
                <p>
                  Tienes {rewards.length}{' '}
                  {rewards.length === 1 ? 'recompensa registrada' : 'recompensas registradas'}. Si
                  ya estaban guardadas, debes descartarlas y guardar el borrador antes de cambiar el
                  tipo de campaña; si no, se mostrarán de nuevo al elegir el tipo Recompensa.
                </p>
              ) : null}
              <div className="wizard-notice__actions">
                <Button variant="secondary" onClick={onChangeCampaignType}>
                  Cambiar tipo de campaña
                </Button>
                {rewards.length > 0 && !disableEdit ? (
                  <Button variant="tertiary" onClick={() => onChange({ rewards: [] })}>
                    Descartar recompensas
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="wizard-wide__grid">
              {!disableEdit ? (
                <section className="wizard-panel" aria-labelledby="reward-form-title">
                  <div className="wizard-panel__head">
                    <h2 className="wizard-panel__title" id="reward-form-title">
                      {editor.editingId ? 'Editar recompensa' : 'Agregar nueva recompensa'}
                    </h2>
                  </div>

                  <div className="wizard-form">
                    <Input
                      label="Título de la recompensa"
                      name="reward-title"
                      required
                      maxLength={120}
                      value={editor.values.title}
                      placeholder="Qué recibirá el patrocinador"
                      error={editor.errors.title}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        editor.setField('title', event.target.value)
                      }
                    />
                    <div className="wizard-field">
                      <label className="wizard-field__label" htmlFor="reward-description">
                        Descripción
                        <span className="wizard-field__required" aria-hidden="true">
                          {' '}
                          *
                        </span>
                      </label>
                      <textarea
                        id="reward-description"
                        className={`wizard-textarea ${descriptionError ? 'wizard-textarea--error' : ''}`}
                        rows={3}
                        maxLength={500}
                        required
                        value={editor.values.description}
                        placeholder="Detalla qué incluye la recompensa"
                        aria-invalid={descriptionError ? true : undefined}
                        aria-describedby={descriptionError ? 'reward-description-error' : undefined}
                        onChange={(event) => editor.setField('description', event.target.value)}
                      />
                      {descriptionError ? (
                        <p id="reward-description-error" className="wizard-field__error" role="alert">
                          {descriptionError}
                        </p>
                      ) : null}
                    </div>
                    <div className="wizard-form__row">
                      <Input
                        label="Aporte mínimo (Bs.)"
                        name="reward-minimum"
                        type="number"
                        required
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={editor.values.minimumContribution}
                        placeholder="0"
                        error={editor.errors.minimumContribution}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          editor.setField('minimumContribution', event.target.value)
                        }
                      />
                      <Input
                        label="Fecha estimada de entrega"
                        name="reward-delivery"
                        type="date"
                        required
                        min={todayLaPazIsoDate()}
                        value={editor.values.estimatedDelivery}
                        error={editor.errors.estimatedDelivery}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          editor.setField('estimatedDelivery', event.target.value)
                        }
                      />
                    </div>
                    <fieldset className="wizard-choice">
                      <legend className="wizard-field__label">Disponibilidad</legend>
                      <div className="wizard-choice__options">
                        {QUANTITY_MODE_OPTIONS.map((option) => (
                          <label key={option.value} className="wizard-choice__option">
                            <input
                              type="radio"
                              name="reward-quantity-mode"
                              value={option.value}
                              checked={editor.values.quantityMode === option.value}
                              onChange={() => changeQuantityMode(option.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    {editor.values.quantityMode === 'limited' ? (
                      <Input
                        label="Cantidad de cupos"
                        name="reward-quantity"
                        type="number"
                        required
                        min={1}
                        max={MAX_REWARD_QUANTITY}
                        step="1"
                        inputMode="numeric"
                        value={editor.values.availableQuantity}
                        placeholder="0"
                        error={editor.errors.availableQuantity}
                        onKeyDown={blockNonIntegerKeys}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          editor.setField('availableQuantity', event.target.value)
                        }
                      />
                    ) : (
                      <p className="wizard-note">
                        Esta recompensa no tendrá un número máximo de cupos.
                      </p>
                    )}
                    <div className="wizard-form__actions">
                      {editor.editingId ? (
                        <Button variant="tertiary" onClick={resetEditor}>
                          Cancelar
                        </Button>
                      ) : null}
                      <Button variant="secondary" onClick={saveReward} disabled={disableEdit}>
                        {editor.editingId ? 'Aplicar cambios' : 'Añadir recompensa'}
                      </Button>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="wizard-panel" aria-labelledby="reward-list-title">
                <div className="wizard-panel__head">
                  <h2 className="wizard-panel__title" id="reward-list-title">
                    Recompensas creadas
                  </h2>
                  <span className="wizard-panel__count">{rewards.length}</span>
                </div>

                {rewards.length === 0 ? (
                  <p className="wizard-panel__empty">
                    Aún no agregaste recompensas. Las que crees aparecerán aquí.
                  </p>
                ) : (
                  <ul className="wizard-list">
                    {rewards.map((reward) => (
                      <li
                        key={reward.id}
                        className={`wizard-item ${editor.editingId === reward.id ? 'is-editing' : ''}`}
                      >
                        <div className="wizard-item__head">
                          <p className="wizard-item__title">{reward.title}</p>
                          {pendingRewardIds.has(reward.id) ? (
                            <span className="wizard-chip wizard-chip--pending">Sin guardar</span>
                          ) : null}
                          <span className="wizard-chip">
                            {formatBob(reward.minimumContribution)}
                          </span>
                        </div>
                        <p className="wizard-item__desc">{reward.description}</p>
                        <div className="wizard-item__meta">
                          <div>
                            <span className="wizard-item__meta-label">Cupos</span>
                            <span className="wizard-item__meta-value">
                              {describeRewardSlots(reward)}
                            </span>
                          </div>
                          <div>
                            <span className="wizard-item__meta-label">Entrega estimada</span>
                            <span className="wizard-item__meta-value">
                              {formatIsoDate(reward.estimatedDelivery)}
                            </span>
                          </div>
                        </div>
                        <div className="wizard-item__actions">
                          {persistedRewardIds.has(reward.id) ? (
                            <button
                              type="button"
                              className="wizard-link-btn"
                              disabled={togglingRewardId !== null}
                              onClick={() => onToggleActive(reward.id, reward.isActive === false)}
                            >
                              {togglingRewardId === reward.id
                                ? 'Guardando…'
                                : reward.isActive === false
                                  ? 'Activar'
                                  : 'Desactivar'}
                            </button>
                          ) : (
                            <span className="wizard-item__meta-label">
                              Guarda el borrador para activar o desactivar.
                            </span>
                          )}
                          {!disableEdit ? (
                            <>
                              <button
                                type="button"
                                className="wizard-link-btn"
                                onClick={() => startEdit(reward)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="wizard-link-btn wizard-link-btn--danger"
                                onClick={() => removeReward(reward.id)}
                              >
                                Eliminar
                              </button>
                            </>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {submitError ? (
            <p className="wizard-note wizard-note--warning" role="alert">
              {submitError}
            </p>
          ) : hasPendingChanges ? (
            <p className="wizard-note wizard-note--warning">
              Tienes cambios en recompensas sin guardar. Se guardan junto con el borrador.
            </p>
          ) : saveFeedback ? (
            <p className="wizard-note">Borrador y recompensas guardados.</p>
          ) : null}

          <div className="wizard-wide__actions">
            <Button variant="tertiary" onClick={onPrevious} disabled={isSubmitting}>
              Atrás
            </Button>
            <div className="wizard-wide__actions-right">
              {hasPendingChanges && !disableEdit ? (
                <Button variant="secondary" onClick={onSave} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando…' : 'Guardar borrador'}
                </Button>
              ) : null}
              <Button variant="primary" onClick={onNext} disabled={isSubmitting}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
