import type { FC } from 'react';
import { Calendar, Gift, Users } from 'lucide-react';
import type { CampaignRewardResponse } from '../../../shared/api/campaignsApi.ts';
import { formatCurrency } from '../../../shared/index.ts';
import { formatIsoDate } from '../../creator/campaign-creation/planningValidation.ts';
import { isRewardSelectable } from '../hooks/useCampaignRewards.ts';
import './CampaignRewardList.css';

export interface CampaignRewardListProps {
  rewards: CampaignRewardResponse[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  /** Con `onSelect`, las recompensas disponibles se pueden elegir. */
  selectedRewardId?: string | null;
  onSelect?: (reward: CampaignRewardResponse) => void;
}

function slotsLabel(reward: CampaignRewardResponse): string {
  if (reward.quantityTotal === null) {
    return reward.quantityClaimed > 0
      ? `Cupos ilimitados · ${reward.quantityClaimed} adjudicados`
      : 'Cupos ilimitados';
  }
  return `${reward.quantityRemaining ?? 0} de ${reward.quantityTotal} disponibles`;
}

function statusLabel(reward: CampaignRewardResponse): string | null {
  if (reward.quantityTotal === null) {
    return reward.isActive ? null : 'Inactiva · Ilimitada';
  }
  if (!reward.isActive && reward.isSoldOut) return 'Inactiva · Agotada';
  if (!reward.isActive) return 'Inactiva';
  if (reward.isSoldOut) return 'Agotada';
  return null;
}

export const CampaignRewardList: FC<CampaignRewardListProps> = ({
  rewards,
  isLoading,
  error,
  onRetry,
  emptyMessage = 'Esta campaña todavía no tiene recompensas.',
  selectedRewardId = null,
  onSelect,
}) => {
  if (isLoading) {
    return <p className="brotar-reward-list__state">Cargando recompensas…</p>;
  }
  if (error) {
    return (
      <div className="brotar-reward-list__state brotar-reward-list__state--error" role="alert">
        <span>{error}</span>
        {onRetry ? (
          <button type="button" className="brotar-reward-list__retry" onClick={onRetry}>
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }
  if (rewards.length === 0) {
    return <p className="brotar-reward-list__state">{emptyMessage}</p>;
  }

  return (
    <ul className="brotar-reward-list">
      {rewards.map((reward) => {
        const status = statusLabel(reward);
        const selectable = Boolean(onSelect) && isRewardSelectable(reward);
        const isSelected = selectedRewardId === reward.id;
        const content = (
          <>
            <div className="brotar-reward-card__head">
              <span className="brotar-reward-card__title">
                <Gift size={16} />
                {reward.title}
              </span>
              <span className="brotar-reward-card__amount">
                Desde {formatCurrency(reward.minimumContribution, reward.currency)}
              </span>
            </div>
            <p className="brotar-reward-card__desc">{reward.description}</p>
            <div className="brotar-reward-card__meta">
              <span>
                <Users size={13} /> {slotsLabel(reward)}
              </span>
              <span>
                <Calendar size={13} /> Entrega estimada: {formatIsoDate(reward.estimatedDeliveryOn)}
              </span>
              {status ? <span className="brotar-reward-card__status">{status}</span> : null}
            </div>
          </>
        );

        return (
          <li key={reward.id}>
            {onSelect ? (
              <button
                type="button"
                className={`brotar-reward-card brotar-reward-card--selectable ${
                  isSelected ? 'is-selected' : ''
                } ${status ? 'is-unavailable' : ''}`}
                aria-pressed={isSelected}
                disabled={!selectable}
                onClick={() => onSelect(reward)}
              >
                {content}
              </button>
            ) : (
              <div className={`brotar-reward-card ${status ? 'is-unavailable' : ''}`}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
