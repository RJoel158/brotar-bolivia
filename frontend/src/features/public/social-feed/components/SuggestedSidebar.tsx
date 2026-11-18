import type { FC } from 'react';
import { ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';
import type { CampaignResponse } from '../../../../shared/api/campaignsApi.ts';
import './SuggestedSidebar.css';

interface SuggestedSidebarProps {
  suggestedCampaigns: CampaignResponse[];
  onSelectCampaign: (campaignId: string) => void;
  onNavigate: (route: string) => void;
}

export const SuggestedSidebar: FC<SuggestedSidebarProps> = ({
  suggestedCampaigns,
  onSelectCampaign,
  onNavigate,
}) => {
  return (
    <aside className="brotar-suggested-sidebar">
      {/* Suggested Projects Section */}
      <div className="brotar-sidebar-section">
        <div className="brotar-sidebar-section-header">
          <div className="brotar-sidebar-section-title-wrap">
            <TrendingUp size={16} className="brotar-sidebar-title-icon" />
            <h4 className="brotar-sidebar-section-title">Sugerencias para ti</h4>
          </div>
          <button
            type="button"
            className="brotar-sidebar-see-all-btn"
            onClick={() => onNavigate('explore-catalog')}
          >
            Ver catálogo
          </button>
        </div>

        <div className="brotar-sidebar-campaigns-list">
          {suggestedCampaigns.length === 0 ? (
            <p className="brotar-sidebar-empty">Cargando proyectos sugeridos…</p>
          ) : (
            suggestedCampaigns.slice(0, 5).map((campaign) => {
              const percentage = campaign.goalAmount > 0
                ? Math.round(((campaign.currentAmount || 0) / campaign.goalAmount) * 100)
                : 0;

              return (
                <div
                  key={campaign.id}
                  className="brotar-sidebar-campaign-item"
                  onClick={() => onSelectCampaign(campaign.id)}
                >
                  <img
                    src={
                      campaign.coverImageUrl ||
                      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&auto=format&fit=crop&q=80'
                    }
                    alt={campaign.title}
                    className="brotar-sidebar-campaign-thumb"
                  />
                  <div className="brotar-sidebar-campaign-info">
                    <span className="brotar-sidebar-campaign-title">
                      {campaign.title}
                    </span>
                    <span className="brotar-sidebar-campaign-category">
                      {campaign.category}
                    </span>
                    <div className="brotar-sidebar-campaign-progress-bar">
                      <div
                        className="brotar-sidebar-campaign-progress-fill"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="brotar-sidebar-campaign-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCampaign(campaign.id);
                    }}
                    title="Ver proyecto"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Navigation & Transparency Badge */}
      <div className="brotar-sidebar-footer">
        <div className="brotar-sidebar-security-badge">
          <ShieldCheck size={16} />
          <span>Crowdfunding seguro y transparente</span>
        </div>

        <nav className="brotar-sidebar-links">
          <button type="button" onClick={() => onNavigate('how-it-works')}>
            Cómo funciona
          </button>
          <span>•</span>
          <button type="button" onClick={() => onNavigate('for-creators')}>
            Para creadores
          </button>
          <span>•</span>
          <button type="button" onClick={() => onNavigate('campaigns')}>
            Campañas
          </button>
        </nav>

        <p className="brotar-sidebar-copyright">
          © {new Date().getFullYear()} Brotar • Sembrando impacto verde
        </p>
      </div>
    </aside>
  );
};
