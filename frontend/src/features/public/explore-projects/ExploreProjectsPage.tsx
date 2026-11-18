import type { FC } from 'react';
import { useState } from 'react';
import {
  X,
  Sprout,
  Sparkles,
  ChevronRight,
  Bookmark,
  Users,
  Heart,
  Target,
  Plus,
  Compass,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatPercentage, BrotinProcessLoader } from '../../../shared/index.ts';
import { type CampaignResponse } from '../../../shared/api/campaignsApi.ts';
import { useCampaignCatalog } from '../../../shared/hooks/useCampaignCatalog.ts';
import { ProjectQuickPreviewModal } from './components/ProjectQuickPreviewModal.tsx';
import { useAuth } from '../../auth/context/useAuth.ts';
import { useToast } from '../../../shared/context/ToastContext.tsx';
import { useCampaignBookmarks } from '../../campaigns/hooks/useCampaignBookmarks.ts';
import './ExploreProjectsPage.css';

export interface ExploreProjectsPageProps {
  onSelectProject?: (projectId: string) => void;
  onNavigate?: (route: string) => void;
  /** Texto buscado desde el header; filtra el catalogo al abrirlo. */
  initialQuery?: string | null;
  /** Categoria controlada desde fuera (filtros superiores de Explorar). */
  category?: string;
  onCategoryChange?: (category: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Para ti' },
  { id: 'ambiental', label: 'Naturaleza' },
  { id: 'social', label: 'Comunidad' },
  { id: 'educacion', label: 'Educación' },
  { id: 'productivo', label: 'Productivo' },
  { id: 'salud', label: 'Salud' },
  { id: 'cultura', label: 'Cultura' },
];

export const ExploreProjectsPage: FC<ExploreProjectsPageProps> = ({
  onSelectProject,
  onNavigate,
  initialQuery = null,
  category,
  onCategoryChange,
}) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const isCreator = user?.role === 'creator';

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? '');
  // Una nueva busqueda desde el header reemplaza el filtro actual.
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  if (initialQuery !== appliedQuery) {
    setAppliedQuery(initialQuery);
    setSearchQuery(initialQuery ?? '');
  }
  // Si Explorar controla la categoria, ambas filas de filtros quedan sincronizadas.
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const selectedCategory = category ?? internalCategory;
  const setSelectedCategory = onCategoryChange ?? setInternalCategory;
  const { items: campaigns, isLoading, isLoadingMore, error, loadMoreError, nextCursor, loadMore, refresh } = useCampaignCatalog(selectedCategory === 'all' ? undefined : selectedCategory, searchQuery);
  const bookmarks = useCampaignBookmarks({ enabled: isAuthenticated });
  const savedIds = bookmarks.savedIds;

  // Quick Preview modal
  const [previewCampaign, setPreviewCampaign] = useState<CampaignResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleToggleBookmark = (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Inicia sesión o regístrate para guardar proyectos favoritos.', 'Acceso Requerido');
      onNavigate?.('login');
      return;
    }
    void bookmarks.toggle(campaignId);
  };

  const handleOpenPreview = (campaign: CampaignResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPreviewCampaign(campaign);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewCampaign(null);
  };

  return (
    <div className="brotar-explore-root">
      <div className="brotar-explore-layout">
        {/* Main Feed Column */}
        <div className="brotar-explore-main">
          {/* Hero Banner Card */}
          <section className="brotar-hero-banner">
            <div className="brotar-hero-banner__ring-1" />
            <div className="brotar-hero-banner__ring-2" />

            <div className="brotar-hero-banner__content">
              <div className="brotar-hero-banner__badge">
                <Sparkles size={14} />
                <span>Impacto que sí se siente</span>
              </div>

              <h1 className="brotar-hero-banner__title">
                Lo que crece contigo,
                <br />
                <span className="brotar-hero-banner__title--highlight">
                  transforma Bolivia.
                </span>
              </h1>

              <p className="brotar-hero-banner__desc">
                Descubre proyectos reales, conoce a quienes los hacen posibles y elige dónde dejar tu huella.
              </p>

              <button
                type="button"
                className="brotar-hero-banner__cta"
                onClick={() => {
                  const exploreEl = document.getElementById('explorar-seccion');
                  exploreEl?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Explorar proyectos</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </section>

          {/* Discover Header */}
          <section id="explorar-seccion" className="brotar-discover-section">
            <div className="brotar-discover-header">
              <div>
                <p className="brotar-discover-eyebrow">Descubre</p>
                <h2 className="brotar-discover-title">Proyectos cerca de ti</h2>
              </div>

              <button
                type="button"
                className="brotar-discover-view-all"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
              >
                <span>Ver todos</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Active search tag if query present */}
            {searchQuery ? (
              <div className="brotar-active-search-chip">
                <span>Resultados para: <strong>"{searchQuery}"</strong></span>
                <button
                  type="button"
                  className="brotar-search-chip-close"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={13} />
                </button>
              </div>
            ) : null}

            {/* Category Filter Pills (No search box in body) */}
            <div className="brotar-category-pills">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`brotar-pill ${isSelected ? 'brotar-pill--active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {error ? (
              <div className="brotar-alert-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            {/* Process Simulator Loading State */}
            {isLoading ? (
              <BrotinProcessLoader
                variant="inline"
                title="Descubriendo iniciativas ecológicas"
                steps={[
                  'Explorando el catálogo de proyectos sostenibles…',
                  'Filtrando causas comunitarias y ambientales…',
                  'Calculando metas y apoyos recaudados…',
                  'Preparando los proyectos para ti 🌱',
                ]}
              />
            ) : null}

            {/* Empty State */}
            {!isLoading && !error && campaigns.length === 0 ? (
              <div className="brotar-empty-state">
                <div className="brotar-empty-state__icon">
                  <Sprout size={36} />
                </div>
                <h3>No hay proyectos en esta categoría</h3>
                <p>Prueba seleccionando otra categoría o limpiando la búsqueda.</p>
                <button
                  type="button"
                  className="brotar-btn-green"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                >
                  Ver todos los proyectos
                </button>
              </div>
            ) : null}

            {/* Campaign Cards Grid */}
            {!isLoading && !error && campaigns.length > 0 ? (
              <div className="brotar-cards-grid">
                {campaigns.map((camp) => {
                  const currency = camp.currency || 'BOB';
                  const progress = formatPercentage(camp.currentAmount, camp.goalAmount);
                  const isSaved = savedIds.has(camp.id);
                  const categoryLabel =
                    camp.category.charAt(0).toUpperCase() + camp.category.slice(1);

                  // Extract author initials
                  const authorInitials = camp.title
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0].toUpperCase())
                    .join('') || 'BR';

                  return (
                    <article
                      key={camp.id}
                      className="brotar-project-card"
                      onClick={() => onSelectProject?.(camp.id)}
                    >
                      {/* Media Image */}
                      <div className="brotar-project-card__media">
                        {camp.coverImageUrl ? (
                          <img
                            src={camp.coverImageUrl}
                            alt={camp.title}
                            loading="lazy"
                            className="brotar-project-card__img"
                          />
                        ) : (
                          <div className="brotar-project-card__placeholder">
                            <Sprout size={36} />
                          </div>
                        )}

                        <div className="brotar-project-card__overlay">
                          <span className="brotar-project-card__category-badge">
                            {categoryLabel}
                          </span>

                          <button
                            type="button"
                            className={`brotar-project-card__bookmark ${
                              isSaved ? 'is-saved' : ''
                            }`}
                            onClick={(e) => handleToggleBookmark(camp.id, e)}
                            aria-label="Guardar proyecto"
                          >
                            <Bookmark size={16} fill={isSaved ? '#0E4B34' : 'none'} />
                          </button>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="brotar-project-card__body">
                        {/* Creator & Location meta */}
                        <div className="brotar-project-card__meta">
                          <span className="brotar-project-card__initials">
                            {authorInitials}
                          </span>
                          <span className="brotar-project-card__author">
                            {camp.location || 'Bolivia'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="brotar-project-card__title" title={camp.title}>
                          {camp.title}
                        </h3>

                        {/* Financial Metrics */}
                        <div className="brotar-project-card__funding">
                          <div>
                            <p className="brotar-funding-amount">
                              {formatCurrency(camp.currentAmount, currency)}
                            </p>
                            <p className="brotar-funding-target">
                              recaudados de {formatCurrency(camp.goalAmount, currency)}
                            </p>
                          </div>
                          <span className="brotar-funding-percentage">
                            {progress}%
                          </span>
                        </div>

                        {/* Gradient Progress Bar */}
                        <div className="brotar-progress-track">
                          <div
                            className="brotar-progress-fill"
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>

                        {/* Card Footer */}
                        <div className="brotar-project-card__footer">
                          <span className="brotar-footer-stat">
                            <Users size={14} />
                            <span>Comunidad</span>
                          </span>

                          <span className="brotar-footer-stat">
                            {camp.fundingModel === 'flexible' ? 'Flexible' : 'Todo o Nada'}
                          </span>

                          <button
                            type="button"
                            className="brotar-card-action-btn"
                            onClick={(e) => handleOpenPreview(camp, e)}
                          >
                            <Heart size={14} />
                            <span>Explorar</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
            {loadMoreError ? <div role="alert"><p>{loadMoreError}</p><button type="button" onClick={refresh}>Actualizar catalogo</button></div> : null}
            {!isLoading && nextCursor ? (
              <button type="button" className="brotar-btn-green" disabled={isLoadingMore} onClick={() => void loadMore()}>
                {isLoadingMore ? 'Cargando...' : 'Cargar mas proyectos'}
              </button>
            ) : null}
          </section>
        </div>

        {/* Right Sidebar Column (Desktop) */}
        <aside className="brotar-explore-sidebar">
          <div className="brotar-sidebar-sticky">
            {/* User Impact / Creator Status Card */}
            {isCreator ? (
              <section className="brotar-sidebar-card">
                <div className="brotar-sidebar-card__header">
                  <h3 className="brotar-sidebar-card__title">Panel de Creador</h3>
                  <span className="brotar-sidebar-card__icon-box">
                    <Target size={18} />
                  </span>
                </div>

                <div className="brotar-sidebar-highlight-box" style={{ marginTop: '0.85rem' }}>
                  <div className="brotar-sidebar-highlight-box__avatar">
                    <Sprout size={16} />
                  </div>
                  <div>
                    <p className="brotar-sidebar-highlight-box__title">
                      Tus Iniciativas Verdes
                    </p>
                    <p className="brotar-sidebar-highlight-box__desc">
                      Gestiona campañas, avances e indicadores de impacto.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="brotar-sidebar-link-btn"
                  onClick={() => onNavigate?.('creator-projects')}
                >
                  <span>Gestionar mis proyectos</span>
                  <ChevronRight size={15} />
                </button>
              </section>
            ) : (
              <section className="brotar-sidebar-card">
                <div className="brotar-sidebar-card__header">
                  <h3 className="brotar-sidebar-card__title">Tu impacto</h3>
                  <span className="brotar-sidebar-card__icon-box">
                    <Target size={18} />
                  </span>
                </div>

                <p className="brotar-sidebar-card__amount">
                  {isAuthenticated ? 'Bs 450' : 'Bs 0'}
                </p>
                <p className="brotar-sidebar-card__subtext">aportados este año</p>

                <div className="brotar-sidebar-highlight-box">
                  <div className="brotar-sidebar-highlight-box__avatar">
                    <Sprout size={16} />
                  </div>
                  <div>
                    <p className="brotar-sidebar-highlight-box__title">
                      Tu brote está creciendo
                    </p>
                    <p className="brotar-sidebar-highlight-box__desc">
                      {isAuthenticated ? 'Has apoyado 3 proyectos' : 'Únete a la comunidad verde'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="brotar-sidebar-link-btn"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.info('Inicia sesión para ver tu impacto y proyectos apoyados.', 'Acceso Requerido');
                      onNavigate?.('login');
                      return;
                    }
                    onNavigate?.('sponsor');
                  }}
                >
                  <span>Ver mi impacto</span>
                  <ChevronRight size={15} />
                </button>
              </section>
            )}

            {/* Create Project CTA Card: Visible only for creators or unauthenticated visitors */}
            {(!isAuthenticated || isCreator) && (
              <section className="brotar-sidebar-card brotar-sidebar-card--green">
                <div className="brotar-sidebar-card__plus-box">
                  <Plus size={20} />
                </div>

                <h3 className="brotar-sidebar-card__cta-title">
                  ¿Tienes una idea que puede brotar?
                </h3>

                <p className="brotar-sidebar-card__cta-desc">
                  Convierte tu proyecto en un movimiento con el apoyo de tu comunidad.
                </p>

                <button
                  type="button"
                  className="brotar-sidebar-publish-btn"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.info('Inicia sesión o crea una cuenta para publicar un proyecto.', 'Acceso Requerido');
                      onNavigate?.('login');
                      return;
                    }
                    onNavigate?.('creator-campaign-create');
                  }}
                >
                  Publicar proyecto
                </button>
              </section>
            )}

            {/* Footer Metadata */}
            <div className="brotar-sidebar-meta-row">
              <span className="brotar-sidebar-meta-item">
                <Compass size={13} />
                <span>Bolivia</span>
              </span>
              <span className="brotar-sidebar-meta-item">
                <Share2 size={13} />
                <span>Impacto compartido</span>
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Quick Preview Modal */}
      <ProjectQuickPreviewModal
        campaign={previewCampaign}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onViewFullDetail={(id) => onSelectProject?.(id)}
      />
    </div>
  );
};
