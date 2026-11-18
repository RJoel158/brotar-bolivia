import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, ChevronDown, Star } from 'lucide-react';
import { calculateDaysRemaining, formatCurrency, formatPercentage } from '../../../shared/index.ts';
import { campaignsApi, type CampaignResponse } from '../../../shared/api/campaignsApi.ts';
import { useCampaignCatalog } from '../../../shared/hooks/useCampaignCatalog.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import {
  categoryLabels,
  heroContent,
  impactStats,
  PROJECTS_PAGE_SIZE,
  purposeCards,
  purposeContent,
} from './homeContent.ts';
import './HomePage.css';

export interface HomePageProps {
  onNavigate?: (route: string) => void;
  onSelectProject?: (projectId: string) => void;
}

const ALL_CATEGORIES = 'all';

/**
 * El layout publico centra el contenido en 1200px (.brotar-main-content), asi que
 * las bandas a sangre completa se sacan con margenes negativos. Usamos el ancho real
 * del viewport (sin la barra de scroll) en vez de 100vw para no provocar desborde
 * horizontal, que rompia el header sticky.
 */
function useViewportWidthVariable(): void {
  useEffect(() => {
    const sync = () => {
      document.documentElement.style.setProperty(
        '--brotar-viewport-width',
        `${document.documentElement.clientWidth}px`,
      );
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);
}

export const HomePage: FC<HomePageProps> = ({ onNavigate, onSelectProject }) => {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof campaignsApi.home>> | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [visibleCount, setVisibleCount] = useState(PROJECTS_PAGE_SIZE);
  const catalog = useCampaignCatalog(activeCategory === ALL_CATEGORIES ? undefined : activeCategory);
  const campaigns = catalog.items;
  const isLoading = summaryLoading || catalog.isLoading;
  const error = summaryError || catalog.error;
  const featured = summary?.featured ?? null;
  const availableCategories = summary?.categories ?? [];
  const gridCampaigns = campaigns.filter(c => c.id !== featured?.id);
  const visibleCampaigns = gridCampaigns.slice(0, visibleCount);
  const totalFiltered = activeCategory === ALL_CATEGORIES ? Math.max(0, (summary?.projects ?? 0) - (featured ? 1 : 0)) : (summary?.categoryCounts[activeCategory] ?? 0);
  const hasMore = visibleCount < gridCampaigns.length || Boolean(catalog.nextCursor);

  useViewportWidthVariable();
  useEffect(() => {
    const controller = new AbortController();
    void campaignsApi.home(controller.signal).then(data => {
      if (!controller.signal.aborted) setSummary(data);
    }).catch(err => {
      if (!controller.signal.aborted) setSummaryError(getApiErrorMessage(err, 'No se pudieron cargar los proyectos.'));
    }).finally(() => { if (!controller.signal.aborted) setSummaryLoading(false); });
    return () => controller.abort();
  }, []);

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setVisibleCount(PROJECTS_PAGE_SIZE);
  };
  const showMore = async () => {
    if (visibleCount >= gridCampaigns.length && catalog.nextCursor) await catalog.loadMore();
    setVisibleCount(count => count + PROJECTS_PAGE_SIZE);
  };

  const renderDaysRemaining = (campaign: CampaignResponse) => {
    if (!campaign.endDate) return 'Sin fecha límite';
    const days = calculateDaysRemaining(campaign.endDate);
    return days === 0 ? 'Último día' : `${days} días restantes`;
  };

  /** Banda de impacto: datos reales de las campañas publicadas. */
  const impactValues = {
    projects: String(summary?.projects ?? 0),
    raised: formatCurrency(Number(summary?.raised ?? 0), summary?.currency || 'BOB'),
    progress: `${summary?.progress ?? 0}%`,
  };

  return (
    <div className="brotar-landing">
      <section className="brotar-landing__bleed brotar-hero">
        <div className="brotar-hero__overlay" />
        <div className="brotar-landing__inner brotar-hero__content">
          <span className="brotar-hero__badge">
            <BadgeCheck size={14} aria-hidden="true" />
            {heroContent.badge}
          </span>
          <h1 className="brotar-hero__title">{heroContent.title}</h1>
          <p className="brotar-hero__description">{heroContent.description}</p>
          <div className="brotar-hero__actions">
            <button
              type="button"
              className="brotar-landing__btn brotar-landing__btn--primary"
              onClick={() => onNavigate?.('explore-projects')}
            >
              {heroContent.primaryAction}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="brotar-landing__btn brotar-landing__btn--ghost"
              onClick={() => onNavigate?.('how-it-works')}
            >
              {heroContent.secondaryAction}
            </button>
          </div>
        </div>
      </section>

      <section className="brotar-landing__bleed brotar-impact">
        <div className="brotar-landing__inner brotar-impact__grid">
          {impactStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div className="brotar-impact__item" key={stat.id}>
                <span className="brotar-impact__icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="brotar-impact__value">
                    {isLoading || error ? '—' : impactValues[stat.id]}
                  </p>
                  <p className="brotar-impact__label">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="brotar-purpose">
        <p className="brotar-purpose__eyebrow">{purposeContent.eyebrow}</p>
        <h2 className="brotar-purpose__title">{purposeContent.title}</h2>
        <p className="brotar-purpose__description">{purposeContent.description}</p>
        <div className="brotar-purpose__grid">
          {purposeCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="brotar-purpose__card" key={card.id}>
                <span className="brotar-purpose__card-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="brotar-purpose__card-title">{card.title}</h3>
                <p className="brotar-purpose__card-text">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {error ? (
        <p className="brotar-landing__message" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="brotar-landing__message">Cargando proyectos publicados…</p>
      ) : null}

      {!isLoading && !error && summary?.projects === 0 ? (
        <p className="brotar-landing__message">
          Todavía no hay proyectos publicados. Vuelve pronto.
        </p>
      ) : null}

      {featured ? (
        <section className="brotar-featured">
          <h2 className="brotar-section-title">Proyecto Destacado</h2>
          <article className="brotar-featured__card">
            <div className="brotar-featured__media">
              {featured.coverImageUrl ? (
                <img src={featured.coverImageUrl} alt="" loading="lazy" />
              ) : (
                <div className="brotar-featured__media-fallback" aria-hidden="true" />
              )}
            </div>
            <div className="brotar-featured__body">
              <p className="brotar-featured__eyebrow">
                {categoryLabels[featured.category] ?? featured.category}
                {featured.location ? ` · ${featured.location}` : ''}
              </p>
              <h3 className="brotar-featured__title">{featured.title}</h3>
              <p className="brotar-featured__summary">
                {featured.shortSummary ?? 'Campaña publicada en Brotar.'}
              </p>

              <div className="brotar-progress">
                <div className="brotar-progress__track">
                  <div
                    className="brotar-progress__fill"
                    style={{
                      width: `${formatPercentage(featured.currentAmount, featured.goalAmount)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="brotar-featured__metrics">
                <div>
                  <p className="brotar-featured__amount">
                    {formatCurrency(featured.currentAmount, featured.currency || 'BOB')}
                  </p>
                  <p className="brotar-featured__amount-label">
                    de meta de {formatCurrency(featured.goalAmount, featured.currency || 'BOB')}
                  </p>
                </div>
                <div className="brotar-featured__metrics-right">
                  <p className="brotar-featured__percentage">
                    {formatPercentage(featured.currentAmount, featured.goalAmount)}%
                  </p>
                  <p className="brotar-featured__amount-label">{renderDaysRemaining(featured)}</p>
                </div>
              </div>

              <div className="brotar-featured__footer">
                <span className="brotar-featured__backers">
                  <Star size={14} aria-hidden="true" />
                  {categoryLabels[featured.category] ?? featured.category} ·{' '}
                  {featured.fundingModel === 'all_or_nothing' ? 'Todo o nada' : 'Financiación flexible'}
                </span>
                <button
                  type="button"
                  className="brotar-landing__btn brotar-landing__btn--dark"
                  onClick={() => onSelectProject?.(featured.id)}
                >
                  Apoyar ahora
                </button>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {summary && summary.projects > (featured ? 1 : 0) ? (
        <section className="brotar-projects">
          <header className="brotar-projects__header">
            <h2 className="brotar-section-title">Proyectos Activos</h2>
            <div className="brotar-projects__filters">
              <button
                type="button"
                className={`brotar-chip ${activeCategory === ALL_CATEGORIES ? 'is-active' : ''}`}
                onClick={() => selectCategory(ALL_CATEGORIES)}
              >
                Todos los proyectos
              </button>
              {availableCategories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`brotar-chip ${activeCategory === category ? 'is-active' : ''}`}
                  onClick={() => selectCategory(category)}
                >
                  {categoryLabels[category] ?? category}
                </button>
              ))}
            </div>
          </header>

          <p className="brotar-projects__count">
            {totalFiltered}{' '}
            {totalFiltered === 1 ? 'campaña activa' : 'campañas activas'}
          </p>

          <div className="brotar-projects__grid">
            {visibleCampaigns.map((campaign) => {
              const percentage = formatPercentage(campaign.currentAmount, campaign.goalAmount);
              return (
                <article className="brotar-project-card" key={campaign.id}>
                  <div className="brotar-project-card__media">
                    {campaign.coverImageUrl ? (
                      <img src={campaign.coverImageUrl} alt="" loading="lazy" />
                    ) : (
                      <div className="brotar-project-card__media-fallback" aria-hidden="true" />
                    )}
                    <span className="brotar-project-card__badge">
                      {categoryLabels[campaign.category] ?? campaign.category}
                    </span>
                  </div>
                  <div className="brotar-project-card__body">
                    <h3 className="brotar-project-card__title">{campaign.title}</h3>
                    <p className="brotar-project-card__summary">
                      {campaign.shortSummary ?? 'Campaña publicada en Brotar.'}
                    </p>

                    <div className="brotar-progress">
                      <div className="brotar-progress__track">
                        <div className="brotar-progress__fill" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>

                    <div className="brotar-project-card__metrics">
                      <span className="brotar-project-card__amount">
                        <strong>
                          {formatCurrency(campaign.currentAmount, campaign.currency || 'BOB')}
                        </strong>{' '}
                        recaudados
                      </span>
                      <span className="brotar-project-card__percentage">{percentage}%</span>
                    </div>

                    <footer className="brotar-project-card__footer">
                      <span>{renderDaysRemaining(campaign)}</span>
                      <button
                        type="button"
                        className="brotar-project-card__link"
                        onClick={() => onSelectProject?.(campaign.id)}
                      >
                        Ver detalles
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </footer>
                  </div>
                </article>
              );
            })}
          </div>

          {catalog.loadMoreError ? <div role="alert"><p>{catalog.loadMoreError}</p><button type="button" onClick={catalog.refresh}>Actualizar proyectos</button></div> : null}
          {hasMore ? (
            <button
              type="button"
              className="brotar-projects__more"
              disabled={catalog.isLoadingMore}
              onClick={() => void showMore()}
            >
              Cargar más proyectos
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};
