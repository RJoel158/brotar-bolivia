import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ClipboardCheck,
  Filter,
  Search,
} from 'lucide-react';
import { campaignsApi, type CampaignResponse } from '../../../shared/api/campaignsApi.ts';
import { formatCurrency } from '../../../shared/index.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { CAMPAIGN_STATUS_LABELS } from '../../campaigns/campaignStatusLabels.ts';
import { CAMPAIGN_CATEGORY_OPTIONS } from '../../creator/campaign-creation/types.ts';
import { CampaignReviewDrawer } from './CampaignReviewDrawer.tsx';
import { LoadErrorNotice } from './LoadErrorNotice.tsx';
import './AdminCampaignReviewView.css';

type SortDir = 'asc' | 'desc';

function categoryLabel(value: string): string {
  return CAMPAIGN_CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function shortenId(id: string): string {
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function OwnerCell({ campaign }: { campaign: CampaignResponse }) {
  const creator = campaign.creatorName?.trim() || null;
  const organization = campaign.organizationName?.trim() || null;

  if (!creator && !organization) {
    return (
      <div className="campaign-owner-cell" title={`ID del propietario: ${campaign.ownerUserId}`}>
        <span className="campaign-owner-missing">Nombre no disponible</span>
        <code className="campaign-owner-id">{shortenId(campaign.ownerUserId)}</code>
      </div>
    );
  }

  return (
    <div className="campaign-owner-cell" title={`ID del propietario: ${campaign.ownerUserId}`}>
      <strong>{creator ?? organization}</strong>
      {creator && organization ? <span>{organization}</span> : null}
    </div>
  );
}

export const AdminCampaignReviewView: FC = () => {
  const [items, setItems] = useState<CampaignResponse[]>([]);
  const [selected, setSelected] = useState<CampaignResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailFresh, setIsDetailFresh] = useState(false);
  const [detailRefreshError, setDetailRefreshError] = useState<string | null>(null);
  const detailRequestRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const loadPending = async () => {
    const data = await campaignsApi.listPendingReview();
    setItems(data);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await campaignsApi.listPendingReview();
        if (cancelled) return;
        setItems(data);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'No se pudo cargar la cola de revisión.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoriesInQueue = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = items.filter((item) => {
      const matchesSearch = !q || item.title.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    list.sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return sortDir === 'asc' ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [items, searchQuery, categoryFilter, sortDir]);

  /** Las decisiones quedan bloqueadas hasta que llega el detalle vigente del servidor. */
  const refreshDetail = async (id: string) => {
    const requestId = ++detailRequestRef.current;
    setIsDetailFresh(false);
    setDetailRefreshError(null);
    try {
      const full = await campaignsApi.getById(id);
      if (requestId !== detailRequestRef.current) return;
      setSelected(full);
      setIsDetailFresh(true);
    } catch (err) {
      if (requestId !== detailRequestRef.current) return;
      setDetailRefreshError(getApiErrorMessage(err, 'No se pudo actualizar el detalle.'));
    }
  };

  const openDetail = (item: CampaignResponse) => {
    setSelected(item);
    void refreshDetail(item.id);
  };

  const closeDetail = () => {
    detailRequestRef.current += 1;
    setSelected(null);
  };

  const handleCampaignUpdated = (updated: CampaignResponse) => {
    detailRequestRef.current += 1;
    setSelected(updated);
    setIsDetailFresh(true);
    setDetailRefreshError(null);
  };

  const handleQueueRefresh = () => {
    void (async () => {
      try {
        await loadPending();
        setError(null);
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudo actualizar la cola.'));
      }
    })();
  };

  const retryQueue = () => {
    setIsLoading(true);
    void (async () => {
      try {
        await loadPending();
        setError(null);
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudo cargar la cola de revisión.'));
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const toggleSort = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="admin-users-view admin-campaign-review">
      <div className="admin-section-header">
        <div className="section-title-wrap">
          <h1 className="admin-page-title">Revisión de campañas</h1>
          <p className="admin-page-subtitle">
            Campañas enviadas por los creadores pendientes de evaluación.
          </p>
        </div>
      </div>

      <div className="campaign-review-summary">
        <article className="campaign-review-summary-card">
          <div className="campaign-review-summary-icon">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <span className="campaign-review-summary-label">Pendientes de revisión</span>
            <strong className="campaign-review-summary-value">
              {isLoading || error ? '—' : items.length}
            </strong>
          </div>
        </article>
      </div>

      <div className="admin-outside-toolbar">
        <div className="search-filter-cluster">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Buscar por título…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-dropdown-anchor">
            <button
              type="button"
              className="btn-filter-trigger"
              onClick={() => setShowCategoryDropdown((v) => !v)}
            >
              <Filter size={16} />
              <span>
                {categoryFilter === 'all' ? 'Todas las categorías' : categoryLabel(categoryFilter)}
              </span>
            </button>
            {showCategoryDropdown ? (
              <div className="filter-dropdown-menu">
                <button
                  type="button"
                  className={`filter-option ${categoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setCategoryFilter('all');
                    setShowCategoryDropdown(false);
                  }}
                >
                  Todas las categorías
                </button>
                {categoriesInQueue.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-option ${categoryFilter === cat ? 'active' : ''}`}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    {categoryLabel(cat)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button type="button" className="btn-filter-trigger" onClick={toggleSort}>
            {sortDir === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span>Fecha de actualización</span>
            <ArrowUpDown size={14} className="sort-icon-idle" />
          </button>
        </div>
      </div>

      {isLoading ? <p className="campaign-review-state">Cargando cola de revisión…</p> : null}
      {error && !isLoading ? (
        <LoadErrorNotice
          summary="No se pudo cargar la cola de revisión."
          error={error}
          onRetry={retryQueue}
        />
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="campaign-review-empty">
          <ClipboardCheck size={28} />
          <h3>No hay campañas pendientes de revisión.</h3>
          <p>Cuando un creador envíe una campaña, aparecerá en esta cola.</p>
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="admin-table-card">
          <div className="verification-table-container">
            <table className="verification-table campaign-review-table">
              <thead>
                <tr>
                  <th>Campaña</th>
                  <th>Categoría</th>
                  <th>Propietario</th>
                  <th>Actualizado</th>
                  <th>Meta</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="campaign-review-table-empty">
                      Ninguna campaña coincide con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="campaign-review-title-cell">
                          <strong>{item.title}</strong>
                          {item.shortSummary ? (
                            <span className="campaign-review-title-sub">{item.shortSummary}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>{categoryLabel(item.category)}</td>
                      <td>
                        <OwnerCell campaign={item} />
                      </td>
                      <td>
                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString('es-BO')}
                      </td>
                      <td>{formatCurrency(item.goalAmount, item.currency || 'BOB')}</td>
                      <td>
                        <span className={`campaign-status-badge status-${item.status}`}>
                          {CAMPAIGN_STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => openDetail(item)}
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="table-card-accent-footer" />
        </div>
      ) : null}

      {selected ? (
        <CampaignReviewDrawer
          key={selected.id}
          campaign={selected}
          isDetailFresh={isDetailFresh}
          detailRefreshError={detailRefreshError}
          onRetryDetailRefresh={() => void refreshDetail(selected.id)}
          onClose={closeDetail}
          onCampaignUpdated={handleCampaignUpdated}
          onQueueShouldRefresh={handleQueueRefresh}
        />
      ) : null}
    </div>
  );
};
