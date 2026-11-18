import type { FC } from 'react';
import {
  X,
  MapPin,
  Sprout,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Button, formatCurrency, formatPercentage } from '../../../../shared/index.ts';
import type { CampaignResponse } from '../../../../shared/api/campaignsApi.ts';
import './ProjectQuickPreviewModal.css';

export interface ProjectQuickPreviewModalProps {
  campaign: CampaignResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFullDetail: (campaignId: string) => void;
}

export const ProjectQuickPreviewModal: FC<ProjectQuickPreviewModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onViewFullDetail,
}) => {
  if (!isOpen || !campaign) return null;

  const currency = campaign.currency || 'BOB';
  const progress = formatPercentage(campaign.currentAmount, campaign.goalAmount);

  return (
    <div className="quick-preview-backdrop" onClick={onClose}>
      <div
        className="quick-preview-modal"
        role="dialog"
        aria-labelledby="preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="quick-preview-close"
          onClick={onClose}
          aria-label="Cerrar vista rápida"
        >
          <X size={20} />
        </button>

        <div className="quick-preview-cover">
          {campaign.coverImageUrl ? (
            <img src={campaign.coverImageUrl} alt={campaign.title} />
          ) : (
            <div className="quick-preview-cover__placeholder">
              <Sprout size={48} />
            </div>
          )}
          <span className="quick-preview-category-badge">
            <Sprout size={13} />
            {campaign.category}
          </span>
        </div>

        <div className="quick-preview-content">
          <div className="quick-preview-meta">
            {campaign.location ? (
              <span className="quick-preview-location">
                <MapPin size={14} />
                {campaign.location}
              </span>
            ) : null}
            <span className="quick-preview-model">
              <Layers size={14} />
              {campaign.fundingModel === 'flexible' ? 'Modelo Flexible' : 'Todo o Nada'}
            </span>
          </div>

          <h2 id="preview-title" className="quick-preview-title">
            {campaign.title}
          </h2>

          <p className="quick-preview-summary">
            {campaign.shortSummary || 'Iniciativa de impacto verde publicada en la comunidad Brotar.'}
          </p>

          <div className="quick-preview-progress">
            <div className="quick-preview-progress__bar">
              <div
                className="quick-preview-progress__fill"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="quick-preview-progress__stats">
              <div>
                <strong>{formatCurrency(campaign.currentAmount, currency)}</strong>
                <span>recaudados de {formatCurrency(campaign.goalAmount, currency)}</span>
              </div>
              <span className="quick-preview-percentage">{progress}%</span>
            </div>
          </div>

          <div className="quick-preview-highlights">
            {campaign.problem ? (
              <div className="quick-preview-highlight-item">
                <strong>Problema a resolver:</strong>
                <p>{campaign.problem}</p>
              </div>
            ) : null}

            {campaign.solution ? (
              <div className="quick-preview-highlight-item">
                <strong>Propuesta de solución:</strong>
                <p>{campaign.solution}</p>
              </div>
            ) : null}
          </div>

          <div className="quick-preview-footer">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onViewFullDetail(campaign.id);
              }}
            >
              Ver proyecto completo
              <ArrowRight size={16} className="btn-icon-right" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
