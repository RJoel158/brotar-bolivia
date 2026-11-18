import type { FC } from 'react';
import { useState, useEffect } from 'react';
import {
  Sprout,
  MapPin,
  Calendar,
  Layers,
  ArrowLeft,
  Share2,
  CheckCircle2,
  FileText,
  Megaphone,
  ShieldCheck,
  Heart,
  Users,
  Target,
  AlertCircle,
  Sparkles,
  Lock,
  Info,
  X,
  ClipboardList,
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../../shared/index.ts';
import type { CampaignResponse, CampaignUpdateItem } from '../../../shared/api/campaignsApi.ts';
import { campaignsApi } from '../../../shared/api/campaignsApi.ts';
import { CAMPAIGN_STATUS_LABELS } from '../campaignStatusLabels.ts';
import { useAuth } from '../../auth/context/useAuth.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { CampaignUpdatesFeed } from './CampaignUpdatesFeed.tsx';
import { CreateCampaignUpdateModal } from './CreateCampaignUpdateModal.tsx';
import { CampaignPlanBudgetView } from './CampaignPlanBudgetView.tsx';
import { CampaignRewardList } from './CampaignRewardList.tsx';
import { useCampaignPlan } from '../hooks/useCampaignPlan.ts';
import { useCampaignRewards } from '../hooks/useCampaignRewards.ts';
import './CampaignDetailView.css';

export interface CampaignDetailViewProps {
  campaign: CampaignResponse;
  variant?: 'page' | 'panel';
  onBack?: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  showSponsorCta?: boolean;
}

export const CampaignDetailView: FC<CampaignDetailViewProps> = ({
  campaign,
  variant = 'page',
  onBack,
  onPrimaryAction,
  primaryActionLabel,
  showSponsorCta = false,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'story' | 'plan' | 'updates'>('story');
  const { plan, isLoading: planLoading, error: planError } = useCampaignPlan(campaign.id);
  const [updatesResult, setUpdatesResult] = useState<{
    campaignId: string;
    items: CampaignUpdateItem[];
    error: string | null;
  } | null>(null);
  const [updatesReloadCount, setUpdatesReloadCount] = useState(0);
  const [isCreateUpdateOpen, setIsCreateUpdateOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currency = campaign.currency || 'BOB';
  const progress = formatPercentage(campaign.currentAmount, campaign.goalAmount);
  const statusLabel = CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status;

  const isOwner = user ? user.id === campaign.ownerUserId || user.role === 'admin' : false;
  const canPostUpdate = isOwner;

  // Resolve Creator / Organization display name
  const creatorDisplayName =
    campaign.organizationName ||
    campaign.creatorName ||
    (isOwner && user?.organizationName ? user.organizationName : isOwner && user?.fullName ? user.fullName : '') ||
    (campaign.organizationId ? 'Organización Ambiental' : 'Comunidad Brotar');

  // Author avatar initials
  const authorInitials =
    creatorDisplayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'BR';

  const isFlexible = campaign.fundingModel === 'flexible';
  const isRewardCampaign = campaign.campaignType === 'reward';
  const rewardsState = useCampaignRewards(campaign.id, isRewardCampaign);

  useEffect(() => {
    let cancelled = false;
    const campaignId = campaign.id;
    campaignsApi.getUpdates(campaignId).then(
      (items) => {
        if (!cancelled) setUpdatesResult({ campaignId, items, error: null });
      },
      (err: unknown) => {
        if (!cancelled) {
          setUpdatesResult({
            campaignId,
            items: [],
            error: getApiErrorMessage(err, 'No se pudieron cargar los avances.'),
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [campaign.id, updatesReloadCount]);

  const loadUpdates = () => setUpdatesReloadCount((count) => count + 1);
  const currentUpdates = updatesResult?.campaignId === campaign.id ? updatesResult : null;
  const updates = currentUpdates?.items ?? [];
  const updatesError = currentUpdates?.error ?? null;

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className={`brotar-detail-root ${variant === 'panel' ? 'brotar-detail-root--panel' : ''}`}>
      <div className="brotar-detail-container">
        {/* Top Navigation Row */}
        <div className="brotar-detail-top-nav">
          {onBack ? (
            <button
              type="button"
              className="brotar-detail-back-btn"
              onClick={onBack}
            >
              <ArrowLeft size={18} />
              <span>Volver a proyectos</span>
            </button>
          ) : <div />}

          <button
            type="button"
            className="brotar-detail-share-btn"
            onClick={handleShare}
            title="Compartir proyecto"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 size={16} color="#17913F" />
                <span>Enlace copiado</span>
              </>
            ) : (
              <>
                <Share2 size={16} />
                <span>Compartir</span>
              </>
            )}
          </button>
        </div>

        {/* Main Grid: Content Column & Desktop Sidebar */}
        <div className="brotar-detail-grid">
          {/* Main Content Column */}
          <div className="brotar-detail-main">
            {/* Hero Cover Card */}
            <div className="brotar-detail-media-card">
              {campaign.coverImageUrl ? (
                <img
                  src={campaign.coverImageUrl}
                  alt={campaign.title}
                  className="brotar-detail-cover-img"
                />
              ) : (
                <div className="brotar-detail-media-placeholder">
                  <Sprout size={48} />
                  <span>Campaña Verde Brotar</span>
                </div>
              )}

              <span className="brotar-detail-category-badge">
                <Sprout size={14} />
                <span>{campaign.category}</span>
              </span>
            </div>

            {/* Title & Metadata Bar */}
            <div className="brotar-detail-header-meta">
              <h1 className="brotar-detail-title">{campaign.title}</h1>

              <div className="brotar-detail-meta-pills">
                {campaign.location ? (
                  <span className="brotar-detail-meta-item">
                    <MapPin size={16} />
                    <span>{campaign.location}</span>
                  </span>
                ) : null}

                <button
                  type="button"
                  className="brotar-detail-meta-item brotar-detail-meta-item--interactive"
                  onClick={() => setIsModelModalOpen(true)}
                  title="Haz clic para ver las reglas de financiamiento"
                >
                  <Layers size={16} />
                  <span>
                    Modelo: <strong>{isFlexible ? 'Flexible' : 'Todo o Nada'}</strong>
                  </span>
                  <Info size={14} className="brotar-meta-info-icon" />
                </button>

                <span className="brotar-detail-meta-item">
                  <ShieldCheck size={16} />
                  <span>
                    Estado: <strong>{statusLabel}</strong>
                  </span>
                </span>
              </div>
            </div>

            {/* Mobile Funding Quick Card (Visible on mobile screens <1024px before the tabs to avoid bottom tail) */}
            <div className="brotar-mobile-funding-box">
              <div className="brotar-mobile-funding-box__header">
                <div>
                  <p className="brotar-funding-box__amount">
                    {formatCurrency(campaign.currentAmount, currency)}
                  </p>
                  <p className="brotar-funding-box__target">
                    recaudados de <strong>{formatCurrency(campaign.goalAmount, currency)}</strong>
                  </p>
                </div>
                <span className="brotar-mobile-progress-badge">{progress}%</span>
              </div>

              {/* Progress track */}
              <div className="brotar-funding-progress-track">
                <div
                  className="brotar-funding-progress-fill"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>

              {/* Mobile CTA Button */}
              {showSponsorCta && campaign.status === 'published' ? (
                <button
                  type="button"
                  className="brotar-funding-cta-btn"
                  onClick={onPrimaryAction}
                >
                  <Heart size={18} />
                  <span>{primaryActionLabel ?? 'Apoyar este Proyecto'}</span>
                </button>
              ) : null}

              {!showSponsorCta && onPrimaryAction && primaryActionLabel ? (
                <button
                  type="button"
                  className="brotar-funding-cta-btn"
                  onClick={onPrimaryAction}
                >
                  <Heart size={18} />
                  <span>{primaryActionLabel}</span>
                </button>
              ) : null}

              {canPostUpdate && (
                <button
                  type="button"
                  className="brotar-funding-cta-btn brotar-funding-cta-btn--owner"
                  style={{ marginTop: '0.65rem' }}
                  onClick={() => setIsCreateUpdateOpen(true)}
                >
                  <Megaphone size={18} />
                  <span>Publicar avance</span>
                </button>
              )}

              {/* Creator Chip on Mobile */}
              <div className="brotar-mobile-creator-chip">
                <div className="brotar-creator-avatar brotar-creator-avatar--sm">{authorInitials}</div>
                <div className="brotar-mobile-creator-text">
                  <span className="brotar-mobile-creator-name">{creatorDisplayName}</span>
                  <span className="brotar-mobile-creator-tag">
                    <ShieldCheck size={12} /> Creador Verificado
                  </span>
                </div>
              </div>
            </div>

            {/* Streamlined Navigation Tabs */}
            <div className="brotar-detail-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'story'}
                className={`brotar-detail-tab-btn ${activeTab === 'story' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('story')}
              >
                <FileText size={17} />
                <span>Historia e Impacto</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'plan'}
                className={`brotar-detail-tab-btn ${activeTab === 'plan' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('plan')}
              >
                <ClipboardList size={17} />
                <span>Plan y Presupuesto</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'updates'}
                className={`brotar-detail-tab-btn ${activeTab === 'updates' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('updates')}
              >
                <Megaphone size={17} />
                <span>Avances</span>
                <span className="brotar-tab-counter">{updates.length}</span>
              </button>
            </div>

            {/* Tab 1: Editorial Unified Story Document Canvas */}
            {activeTab === 'story' && (
              <div className="brotar-tab-content">
                <div className="brotar-story-canvas">
                  {/* 1. Lead Narrative Intro / Hook */}
                  {campaign.shortSummary ? (
                    <div className="brotar-story-lead">
                      <p className="brotar-story-lead__text">{campaign.shortSummary}</p>
                    </div>
                  ) : null}

                  {/* 2. El Desafío Socio-Ambiental */}
                  <section className="brotar-story-section">
                    <div className="brotar-story-section__header">
                      <span className="brotar-story-badge brotar-story-badge--amber">
                        <AlertCircle size={14} />
                        El Contexto
                      </span>
                      <h2 className="brotar-story-section__title">El Desafío Socio-Ambiental</h2>
                    </div>
                    <p className="brotar-story-section__text">
                      {campaign.problem ||
                        'Este proyecto responde a una necesidad ambiental crítica en la región, requiriendo acción coordinada para restaurar el equilibrio de los ecosistemas locales.'}
                    </p>
                  </section>

                  <div className="brotar-story-divider" />

                  {/* 3. Nuestra Solución y Estrategia */}
                  <section className="brotar-story-section brotar-story-section--solution">
                    <div className="brotar-story-section__header">
                      <span className="brotar-story-badge brotar-story-badge--green">
                        <Sparkles size={14} />
                        La Estrategia
                      </span>
                      <h2 className="brotar-story-section__title">Nuestra Propuesta de Solución</h2>
                    </div>
                    <div className="brotar-story-solution-box">
                      <p className="brotar-story-section__text">
                        {campaign.solution ||
                          'Implementamos metodologías sostenibles enfocadas en el impacto tangible a largo plazo, involucrando a la comunidad y garantizando la regeneración ecológica.'}
                      </p>
                    </div>
                  </section>

                  <div className="brotar-story-divider" />

                  {/* 4. Impact & Beneficiaries Unified Grid */}
                  <section className="brotar-story-section">
                    <h3 className="brotar-story-subheading">Alcance y Ecosistema de Impacto</h3>
                    <div className="brotar-impact-grid">
                      <div className="brotar-impact-card">
                        <div className="brotar-impact-card__icon-wrap">
                          <Users size={20} />
                        </div>
                        <div className="brotar-impact-card__content">
                          <h4 className="brotar-impact-card__title">Comunidad y Beneficiarios</h4>
                          <p className="brotar-impact-card__desc">
                            {campaign.beneficiaries ||
                              'Comunidad local, familias del entorno y biodiversidad regional en Bolivia.'}
                          </p>
                        </div>
                      </div>

                      <div className="brotar-impact-card">
                        <div className="brotar-impact-card__icon-wrap">
                          <Target size={20} />
                        </div>
                        <div className="brotar-impact-card__content">
                          <h4 className="brotar-impact-card__title">Impacto Ecológico Proyectado</h4>
                          <p className="brotar-impact-card__desc">
                            {campaign.expectedImpact ||
                              'Preservación de recursos naturales, reducción de huella ecológica y desarrollo sostenible.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 5. Key Impact Indicators */}
                  {campaign.impactIndicators ? (
                    <section className="brotar-story-section">
                      <h3 className="brotar-story-subheading">Indicadores Clave de Medición</h3>
                      <div className="brotar-indicators-list">
                        {campaign.impactIndicators
                          .split(/[,;\n]/)
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .map((indicator, idx) => (
                            <span key={idx} className="brotar-indicator-chip">
                              <Sparkles size={14} />
                              <span>{indicator}</span>
                            </span>
                          ))}
                      </div>
                    </section>
                  ) : null}

                  {isRewardCampaign ? (
                    <section className="brotar-story-section">
                      <h3 className="brotar-story-subheading">Recompensas</h3>
                      <CampaignRewardList
                        rewards={rewardsState.rewards}
                        isLoading={rewardsState.isLoading}
                        error={rewardsState.error}
                        onRetry={rewardsState.reload}
                      />
                    </section>
                  ) : null}

                  {/* 6. Formal Minimalist Transparency Note */}
                  <div className="brotar-story-transparency-card">
                    <div className="brotar-transparency-icon">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="brotar-transparency-content">
                      <h4 className="brotar-transparency-title">Compromiso de Transparencia y Trazabilidad</h4>
                      <p className="brotar-transparency-text">
                        Cada aporte canalizado en Brotar cuenta con auditoría ciudadana y reportes periódicos de avances, asegurando que los recursos impulsen un impacto ambiental medible y verificable.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="brotar-tab-content">
                <div className="brotar-story-canvas">
                  {planLoading ? (
                    <p className="brotar-story-section__text">Cargando plan y presupuesto…</p>
                  ) : planError ? (
                    <p className="brotar-story-section__text" role="alert">
                      {planError}
                    </p>
                  ) : plan ? (
                    <CampaignPlanBudgetView
                      activities={plan.activities}
                      budgetItems={plan.budgetItems}
                      goalAmount={campaign.goalAmount}
                      currency={currency}
                    />
                  ) : null}
                </div>
              </div>
            )}

            {/* Tab 2: Campaign Updates Feed */}
            {activeTab === 'updates' && (
              <div className="brotar-tab-content">
                {updatesError ? (
                  <p className="brotar-story-section__text" role="alert">
                    {updatesError}{' '}
                    <button type="button" className="link-btn" onClick={loadUpdates}>
                      Reintentar
                    </button>
                  </p>
                ) : null}
                <CampaignUpdatesFeed
                  campaignId={campaign.id}
                  updates={updates}
                  isOwner={isOwner}
                  canPostUpdate={canPostUpdate}
                  onOpenCreateModal={() => setIsCreateUpdateOpen(true)}
                  onUpdateCreated={loadUpdates}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar: Desktop-only Funding & Creator Card (Hidden on mobile <1024px to prevent tail) */}
          <aside className="brotar-detail-sidebar">
            {/* Funding Progress Card */}
            <div className="brotar-funding-box">
              <p className="brotar-funding-box__amount">
                {formatCurrency(campaign.currentAmount, currency)}
              </p>
              <p className="brotar-funding-box__target">
                recaudados de <strong>{formatCurrency(campaign.goalAmount, currency)}</strong>
              </p>

              {/* Progress track */}
              <div className="brotar-funding-progress-track">
                <div
                  className="brotar-funding-progress-fill"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>

              {/* Stats Row */}
              <div className="brotar-funding-stats-row">
                <div className="brotar-funding-stat-item">
                  <span className="brotar-funding-stat-val">{progress}%</span>
                  <span className="brotar-funding-stat-lbl">Progreso global</span>
                </div>
                <div className="brotar-funding-stat-item">
                  <span className="brotar-funding-stat-val">{statusLabel}</span>
                  <span className="brotar-funding-stat-lbl">Estado</span>
                </div>
              </div>

              {/* Campaign Dates Timeline */}
              {(campaign.startDate || campaign.endDate) ? (
                <div className="brotar-funding-dates-row">
                  <Calendar size={15} />
                  <span>
                    {campaign.endDate
                      ? `Cierre: ${new Date(campaign.endDate).toLocaleDateString('es-BO')}`
                      : 'Campaña en curso'}
                  </span>
                </div>
              ) : null}

              {/* Support CTA Button */}
              {showSponsorCta && campaign.status === 'published' ? (
                <button
                  type="button"
                  className="brotar-funding-cta-btn"
                  onClick={onPrimaryAction}
                >
                  <Heart size={18} />
                  <span>{primaryActionLabel ?? 'Apoyar este Proyecto'}</span>
                </button>
              ) : null}

              {!showSponsorCta && onPrimaryAction && primaryActionLabel ? (
                <button
                  type="button"
                  className="brotar-funding-cta-btn"
                  onClick={onPrimaryAction}
                >
                  <Heart size={18} />
                  <span>{primaryActionLabel}</span>
                </button>
              ) : null}

              {canPostUpdate && (
                <div style={{ marginTop: '0.85rem' }}>
                  <button
                    type="button"
                    className="brotar-funding-cta-btn brotar-funding-cta-btn--owner"
                    onClick={() => setIsCreateUpdateOpen(true)}
                  >
                    <Megaphone size={18} />
                    <span>Publicar avance</span>
                  </button>
                </div>
              )}

              <div className="brotar-funding-security-note">
                <Lock size={13} />
                <span>Aportes protegidos · Transparencia Brotar</span>
              </div>
            </div>

            {/* Creator Profile Card */}
            <div className="brotar-creator-card">
              <p className="brotar-creator-card__header">Iniciativa impulsada por</p>
              <div className="brotar-creator-profile-row">
                <div className="brotar-creator-avatar">{authorInitials}</div>
                <div className="brotar-creator-info">
                  <p className="brotar-creator-name">{creatorDisplayName}</p>
                  <span className="brotar-creator-badge">
                    <ShieldCheck size={14} />
                    <span>Creador Verificado</span>
                  </span>
                  {campaign.location ? (
                    <p className="brotar-creator-location">
                      <MapPin size={12} />
                      <span>{campaign.location}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Funding Model Rules Modal */}
      {isModelModalOpen && (
        <div className="brotar-modal-overlay" onClick={() => setIsModelModalOpen(false)}>
          <div
            className="brotar-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="brotar-modal-header">
              <div className="brotar-modal-title-group">
                <Layers size={20} color="#17913F" />
                <h3 className="brotar-modal-title">Reglas del Modelo de Financiamiento</h3>
              </div>
              <button
                type="button"
                className="brotar-modal-close-btn"
                onClick={() => setIsModelModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="brotar-modal-body">
              <div className={`brotar-model-card ${isFlexible ? 'brotar-model-card--active' : ''}`}>
                <div className="brotar-model-card__title-row">
                  <span className="brotar-model-pill">Modalidad Flexible</span>
                  {isFlexible ? <span className="brotar-model-current-tag">Este proyecto</span> : null}
                </div>
                <p className="brotar-model-desc">
                  Todos los aportes son canalizados directamente a la organización o creador para la ejecución progresiva del proyecto ambiental, permitiendo avanzar aún si no se alcanza la meta total.
                </p>
              </div>

              <div className={`brotar-model-card ${!isFlexible ? 'brotar-model-card--active' : ''}`}>
                <div className="brotar-model-card__title-row">
                  <span className="brotar-model-pill">Modalidad Todo o Nada</span>
                  {!isFlexible ? <span className="brotar-model-current-tag">Este proyecto</span> : null}
                </div>
                <p className="brotar-model-desc">
                  Los fondos únicamente son transferidos si el proyecto alcanza o supera el 100% de la meta financiera antes de la fecha límite. Si la meta no se logra, los aportes son reintegrados a los patrocinadores.
                </p>
              </div>

              <div className="brotar-model-security-footer">
                <ShieldCheck size={18} color="#17913F" />
                <span>
                  Brotar supervisa el cumplimiento de hitos y la transparencia mediante reportes periódicos de avances.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for creating campaign updates */}
      <CreateCampaignUpdateModal
        campaignId={campaign.id}
        isOpen={isCreateUpdateOpen}
        onClose={() => setIsCreateUpdateOpen(false)}
        onSuccess={loadUpdates}
      />
    </div>
  );
};
