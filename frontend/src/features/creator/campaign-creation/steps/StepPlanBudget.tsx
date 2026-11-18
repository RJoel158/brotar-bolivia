import type { ChangeEvent } from 'react';
import { Button, Input } from '../../../../shared/index.ts';
import { CampaignCreationNav } from '../components/CampaignCreationNav.tsx';
import { CampaignStepProgress } from '../components/CampaignStepProgress.tsx';
import { useItemEditor } from '../hooks/useItemEditor.ts';
import {
  BUDGET_CATEGORY_OPTIONS,
  EMPTY_ACTIVITY_FORM,
  EMPTY_BUDGET_FORM,
  MAX_ACTIVITIES,
  MAX_ACTIVITY_DESCRIPTION_LENGTH,
  MAX_ACTIVITY_NAME_LENGTH,
  MAX_BUDGET_AMOUNT,
  MAX_BUDGET_CONCEPT_LENGTH,
  MAX_BUDGET_ITEMS,
  blockNonDecimalKeys,
  createLocalId,
  formatBob,
  formatIsoDate,
  maxPlanIsoDate,
  todayIsoDate,
  validateActivity,
  validateBudgetItem,
} from '../planningValidation.ts';
import type { BudgetItem, CampaignPlanningDraft, PlanActivity } from '../types.ts';
import '../components/WizardPanel.css';

export interface StepPlanBudgetProps {
  planning: CampaignPlanningDraft;
  goalAmount: number | null;
  loadError?: string | null;
  isRetryingLoad?: boolean;
  onRetryLoad?: () => void;
  onChange: (patch: Partial<CampaignPlanningDraft>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function StepPlanBudget({
  planning,
  goalAmount,
  loadError = null,
  isRetryingLoad = false,
  onRetryLoad,
  onChange,
  onNext,
  onPrevious,
}: StepPlanBudgetProps) {
  const activityEditor = useItemEditor(EMPTY_ACTIVITY_FORM, validateActivity);
  const budgetEditor = useItemEditor(EMPTY_BUDGET_FORM, validateBudgetItem);
  const { activities, budgetItems } = planning;

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const exceedsGoal = goalAmount !== null && goalAmount > 0 && totalBudget > goalAmount;
  const activityLimitReached = !activityEditor.editingId && activities.length >= MAX_ACTIVITIES;
  const budgetLimitReached = !budgetEditor.editingId && budgetItems.length >= MAX_BUDGET_ITEMS;
  const minDate = todayIsoDate();
  const maxDate = maxPlanIsoDate();

  const saveActivity = () => {
    activityEditor.submit((values, editingId) => {
      const activity: PlanActivity = {
        id: editingId ?? createLocalId(),
        name: values.name.trim(),
        description: values.description.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
      };
      onChange({
        activities: editingId
          ? activities.map((item) => (item.id === editingId ? activity : item))
          : [...activities, activity],
      });
    });
  };

  const removeActivity = (id: string) => {
    if (activityEditor.editingId === id) {
      activityEditor.reset();
    }
    onChange({ activities: activities.filter((item) => item.id !== id) });
  };

  const saveBudgetItem = () => {
    budgetEditor.submit((values, editingId) => {
      const item: BudgetItem = {
        id: editingId ?? createLocalId(),
        category: values.category,
        concept: values.concept.trim(),
        amount: Number(values.amount),
      };
      onChange({
        budgetItems: editingId
          ? budgetItems.map((current) => (current.id === editingId ? item : current))
          : [...budgetItems, item],
      });
    });
  };

  const removeBudgetItem = (id: string) => {
    if (budgetEditor.editingId === id) {
      budgetEditor.reset();
    }
    onChange({ budgetItems: budgetItems.filter((item) => item.id !== id) });
  };

  return (
    <section className="wizard-wide">
      <CampaignStepProgress step={4} />

      <div className="wizard-wide__layout">
        <CampaignCreationNav currentStep={4} />

        <div className="wizard-wide__content">
          <header className="wizard-wide__header">
            <h1>Plan de trabajo y presupuesto</h1>
            <p>Qué se va a hacer, cuándo y con cuánto.</p>
          </header>

          {loadError ? (
            <div className="wizard-notice" role="alert">
              <p>{loadError}</p>
              <p>No puedes editar el plan hasta recuperarlo, para no reemplazar el guardado.</p>
              {onRetryLoad ? (
                <div className="wizard-notice__actions">
                  <Button variant="secondary" disabled={isRetryingLoad} onClick={onRetryLoad}>
                    {isRetryingLoad ? 'Reintentando…' : 'Reintentar'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="wizard-wide__grid">
              <section className="wizard-panel" aria-labelledby="plan-activities-title">
                <div className="wizard-panel__head">
                  <h2 className="wizard-panel__title" id="plan-activities-title">
                    Actividades y cronograma
                  </h2>
                  <span className="wizard-panel__count">
                    {activities.length} {activities.length === 1 ? 'actividad' : 'actividades'}
                  </span>
                </div>

                {activities.length === 0 ? (
                  <p className="wizard-panel__empty">
                    Aún no registraste actividades. Agrega las fases principales del proyecto.
                  </p>
                ) : (
                  <ol className="wizard-list">
                    {activities.map((activity, index) => (
                      <li
                        key={activity.id}
                        className={`wizard-item ${activityEditor.editingId === activity.id ? 'is-editing' : ''}`}
                      >
                        <div className="wizard-item__head">
                          <p className="wizard-item__title">
                            Fase {index + 1}: {activity.name}
                          </p>
                        </div>
                        {activity.description ? (
                          <p className="wizard-item__desc">{activity.description}</p>
                        ) : null}
                        <div className="wizard-item__meta">
                          <div>
                            <span className="wizard-item__meta-label">Inicio</span>
                            <span className="wizard-item__meta-value">
                              {formatIsoDate(activity.startDate)}
                            </span>
                          </div>
                          <div>
                            <span className="wizard-item__meta-label">Fin</span>
                            <span className="wizard-item__meta-value">
                              {formatIsoDate(activity.endDate)}
                            </span>
                          </div>
                        </div>
                        <div className="wizard-item__actions">
                          <button
                            type="button"
                            className="wizard-link-btn"
                            onClick={() =>
                              activityEditor.startEdit(activity.id, {
                                name: activity.name,
                                description: activity.description,
                                startDate: activity.startDate,
                                endDate: activity.endDate,
                              })
                            }
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="wizard-link-btn wizard-link-btn--danger"
                            onClick={() => removeActivity(activity.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                <h3 className="wizard-panel__subtitle">
                  {activityEditor.editingId ? 'Editar actividad' : 'Nueva actividad'}
                </h3>
                <div className="wizard-form">
                  <Input
                    label="Actividad o fase"
                    name="plan-activity-name"
                    required
                    maxLength={MAX_ACTIVITY_NAME_LENGTH}
                    value={activityEditor.values.name}
                    placeholder="Nombre de la actividad"
                    error={activityEditor.errors.name}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      activityEditor.setField('name', event.target.value)
                    }
                  />
                  <div className="wizard-field">
                    <label className="wizard-field__label" htmlFor="plan-activity-description">
                      Descripción
                    </label>
                    <textarea
                      id="plan-activity-description"
                      className={`wizard-textarea ${activityEditor.errors.description ? 'wizard-textarea--error' : ''}`}
                      rows={3}
                      maxLength={MAX_ACTIVITY_DESCRIPTION_LENGTH}
                      value={activityEditor.values.description}
                      placeholder="Qué se realizará en esta fase"
                      aria-invalid={Boolean(activityEditor.errors.description)}
                      onChange={(event) =>
                        activityEditor.setField('description', event.target.value)
                      }
                    />
                    {activityEditor.errors.description ? (
                      <span className="wizard-field__error">{activityEditor.errors.description}</span>
                    ) : null}
                  </div>
                  <div className="wizard-form__row">
                    <Input
                      label="Inicio"
                      name="plan-activity-start"
                      type="date"
                      required
                      min={minDate}
                      max={maxDate}
                      value={activityEditor.values.startDate}
                      error={activityEditor.errors.startDate}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        activityEditor.setField('startDate', event.target.value)
                      }
                    />
                    <Input
                      label="Fin"
                      name="plan-activity-end"
                      type="date"
                      required
                      min={activityEditor.values.startDate || minDate}
                      max={maxDate}
                      value={activityEditor.values.endDate}
                      error={activityEditor.errors.endDate}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        activityEditor.setField('endDate', event.target.value)
                      }
                    />
                  </div>
                  <div className="wizard-form__actions">
                    {activityEditor.editingId ? (
                      <Button variant="tertiary" onClick={activityEditor.reset}>
                        Cancelar
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      onClick={saveActivity}
                      disabled={activityLimitReached}
                    >
                      {activityEditor.editingId ? 'Guardar cambios' : 'Añadir actividad'}
                    </Button>
                  </div>
                  {activityLimitReached ? (
                    <p className="wizard-note wizard-note--warning">
                      Alcanzaste el máximo de {MAX_ACTIVITIES} actividades.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="wizard-panel" aria-labelledby="plan-budget-title">
                <div className="wizard-panel__head">
                  <h2 className="wizard-panel__title" id="plan-budget-title">
                    Presupuesto y gastos
                  </h2>
                </div>

                {budgetItems.length === 0 ? (
                  <p className="wizard-panel__empty">Aún no registraste gastos.</p>
                ) : (
                  <ul className="wizard-budget-list">
                    {budgetItems.map((item) => (
                      <li key={item.id} className="wizard-budget-row">
                        <span className="wizard-budget-row__concept">
                          <span className="wizard-chip">{item.category}</span> {item.concept}
                        </span>
                        <span className="wizard-budget-row__right">
                          <span className="wizard-budget-row__amount">{formatBob(item.amount)}</span>
                          <button
                            type="button"
                            className="wizard-link-btn"
                            aria-label={`Editar gasto ${item.concept}`}
                            onClick={() =>
                              budgetEditor.startEdit(item.id, {
                                category: item.category,
                                concept: item.concept,
                                amount: String(item.amount),
                              })
                            }
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="wizard-link-btn wizard-link-btn--danger"
                            aria-label={`Eliminar gasto ${item.concept}`}
                            onClick={() => removeBudgetItem(item.id)}
                          >
                            Quitar
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="wizard-budget-total" aria-live="polite">
                  <span className="wizard-budget-total__label">Total requerido</span>
                  <strong className="wizard-budget-total__value">{formatBob(totalBudget)}</strong>
                </div>

                {goalAmount !== null && goalAmount > 0 ? (
                  <p className={`wizard-note ${exceedsGoal ? 'wizard-note--warning' : ''}`}>
                    {exceedsGoal
                      ? `El presupuesto supera la meta de financiamiento definida (${formatBob(goalAmount)}).`
                      : `Meta de financiamiento definida: ${formatBob(goalAmount)}.`}
                  </p>
                ) : null}

                <h3 className="wizard-panel__subtitle">
                  {budgetEditor.editingId ? 'Editar gasto' : 'Nuevo gasto'}
                </h3>
                <div className="wizard-form">
                  <div className="wizard-field">
                    <label className="wizard-field__label" htmlFor="budget-category">
                      Categoría <span className="wizard-field__required">*</span>
                    </label>
                    <select
                      id="budget-category"
                      className={`wizard-select ${budgetEditor.errors.category ? 'wizard-select--error' : ''}`}
                      value={budgetEditor.values.category}
                      aria-invalid={Boolean(budgetEditor.errors.category)}
                      onChange={(event) => budgetEditor.setField('category', event.target.value)}
                    >
                      <option value="">Selecciona una categoría</option>
                      {BUDGET_CATEGORY_OPTIONS.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {budgetEditor.errors.category ? (
                      <span className="wizard-field__error">{budgetEditor.errors.category}</span>
                    ) : null}
                  </div>
                  <Input
                    label="Concepto"
                    name="budget-concept"
                    required
                    maxLength={MAX_BUDGET_CONCEPT_LENGTH}
                    value={budgetEditor.values.concept}
                    placeholder="Categoría o concepto del gasto"
                    error={budgetEditor.errors.concept}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      budgetEditor.setField('concept', event.target.value)
                    }
                  />
                  <Input
                    label="Monto (Bs.)"
                    name="budget-amount"
                    type="number"
                    required
                    min={0.01}
                    max={MAX_BUDGET_AMOUNT}
                    step="0.01"
                    inputMode="decimal"
                    onKeyDown={blockNonDecimalKeys}
                    value={budgetEditor.values.amount}
                    placeholder="0"
                    error={budgetEditor.errors.amount}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      budgetEditor.setField('amount', event.target.value)
                    }
                  />
                  <div className="wizard-form__actions">
                    {budgetEditor.editingId ? (
                      <Button variant="tertiary" onClick={budgetEditor.reset}>
                        Cancelar
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      onClick={saveBudgetItem}
                      disabled={budgetLimitReached}
                    >
                      {budgetEditor.editingId ? 'Guardar cambios' : 'Añadir gasto'}
                    </Button>
                  </div>
                  {budgetLimitReached ? (
                    <p className="wizard-note wizard-note--warning">
                      Alcanzaste el máximo de {MAX_BUDGET_ITEMS} gastos.
                    </p>
                  ) : null}
                </div>
              </section>
            </div>
          )}

          <p className="wizard-note">
            El plan y el presupuesto se guardan junto con el borrador cuando presionas
            &quot;Guardar&quot; en Financiamiento o en la Revisión final.
          </p>

          <div className="wizard-wide__actions">
            <Button variant="tertiary" onClick={onPrevious}>
              Atrás
            </Button>
            <div className="wizard-wide__actions-right">
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
