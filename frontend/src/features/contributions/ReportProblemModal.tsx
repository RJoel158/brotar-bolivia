import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import {
  contributionsApi,
  type Contribution,
  type SponsorDispute,
  type SponsorDisputeType,
} from '../../shared/api/contributionsApi.ts';
import { getApiErrorMessage } from '../auth/utils/getApiErrorMessage.ts';
import { disputeTypeLabels } from './contributionLabels.ts';

const MIN_DESCRIPTION = 20;
const MAX_DESCRIPTION = 1000;

export interface ReportProblemModalProps {
  contribution: Contribution;
  isOpen: boolean;
  onClose: () => void;
  onReported: (dispute: SponsorDispute) => void;
}

/** Opciones de problema segun el estado y el tipo del aporte. */
function availableTypes(contribution: Contribution): SponsorDisputeType[] {
  const types: SponsorDisputeType[] = ['payment_not_recognized'];
  if (contribution.status === 'confirmed') {
    if (contribution.rewardId) types.push('reward_not_received');
    types.push('project_not_executed', 'refund_request');
  }
  types.push('other');
  return types;
}

/**
 * "Reportar problema": abre un caso en la bandeja de disputas del equipo de
 * Brotar, vinculado a este aporte. El administrador responde desde Finanzas.
 */
export const ReportProblemModal: FC<ReportProblemModalProps> = ({
  contribution,
  isOpen,
  onClose,
  onReported,
}) => {
  const types = useMemo(() => availableTypes(contribution), [contribution]);
  const [disputeType, setDisputeType] = useState<SponsorDisputeType>(types[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = description.trim();
  const isValid = trimmed.length >= MIN_DESCRIPTION && trimmed.length <= MAX_DESCRIPTION;

  const submit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const dispute = await contributionsApi.reportProblem(contribution.id, {
        disputeType,
        description: trimmed,
      });
      setDescription('');
      setError(null);
      onReported(dispute);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar el reporte.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="brotar-report-modal" role="dialog" aria-modal="true" aria-labelledby="brotar-report-title">
      <div className="brotar-report-modal__backdrop" onClick={onClose} />
      <div className="brotar-report-modal__panel">
        <header className="brotar-report-modal__header">
          <span className="brotar-report-modal__icon">
            <AlertTriangle size={18} />
          </span>
          <div>
            <h2 id="brotar-report-title">Reportar un problema</h2>
            <p>
              Aporte a <strong>{contribution.campaignTitle}</strong>. El equipo de Brotar revisará tu
              caso y te responderá.
            </p>
          </div>
          <button type="button" className="brotar-report-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <fieldset className="brotar-report-modal__types">
          <legend>¿Qué pasó?</legend>
          {types.map((type) => (
            <label key={type} className={disputeType === type ? 'is-active' : ''}>
              <input
                type="radio"
                name="dispute-type"
                value={type}
                checked={disputeType === type}
                onChange={() => setDisputeType(type)}
              />
              {disputeTypeLabels[type]}
            </label>
          ))}
        </fieldset>

        <label className="brotar-checkout__field">
          <span>Cuéntanos el detalle</span>
          <textarea
            maxLength={MAX_DESCRIPTION}
            value={description}
            placeholder="Describe qué pasó, desde cuándo y cualquier dato que nos ayude a revisarlo…"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <p className={`brotar-report-modal__counter ${trimmed.length > 0 && !isValid ? 'is-error' : ''}`}>
          {trimmed.length < MIN_DESCRIPTION
            ? `Escribe al menos ${MIN_DESCRIPTION} caracteres (${trimmed.length}/${MIN_DESCRIPTION}).`
            : `${trimmed.length}/${MAX_DESCRIPTION}`}
        </p>

        {error ? <p className="brotar-checkout__error">{error}</p> : null}

        <div className="brotar-report-modal__actions">
          <button type="button" className="brotar-checkout__ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="brotar-checkout__cta"
            disabled={!isValid || isSubmitting}
            onClick={() => void submit()}
          >
            {isSubmitting ? <Loader2 size={16} className="brotar-checkout__spin" /> : null}
            Enviar reporte
          </button>
        </div>
      </div>
    </div>
  );
};
