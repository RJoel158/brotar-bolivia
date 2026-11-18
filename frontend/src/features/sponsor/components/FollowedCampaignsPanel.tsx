import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Bookmark, ExternalLink } from 'lucide-react';
import { Card, Button } from '../../../shared/index.ts';
import {
  campaignsApi,
  type CampaignBookmarkItem,
} from '../../../shared/api/campaignsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';

export interface FollowedCampaignsPanelProps {
  onOpenCampaign?: (campaignId: string) => void;
  onExplore?: () => void;
}

interface PanelSnapshot {
  key: number;
  items: CampaignBookmarkItem[];
  error: string | null;
}

export const FollowedCampaignsPanel: FC<FollowedCampaignsPanelProps> = ({
  onOpenCampaign,
  onExplore,
}) => {
  const [reloadCount, setReloadCount] = useState(0);
  const [snapshot, setSnapshot] = useState<PanelSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void campaignsApi.listMyBookmarks().then(
      (items) => {
        if (!cancelled) setSnapshot({ key: reloadCount, items, error: null });
      },
      (err: unknown) => {
        if (!cancelled) {
          setSnapshot({
            key: reloadCount,
            items: [],
            error: getApiErrorMessage(err, 'No se pudieron cargar tus proyectos seguidos.'),
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const current = snapshot?.key === reloadCount ? snapshot : null;
  const items = current?.items ?? [];
  const error = current?.error ?? null;
  const isLoading = current === null;

  const handleRemove = useCallback(
    async (campaignId: string) => {
      if (!current) return;
      const previous = current.items;
      setSnapshot({
        key: reloadCount,
        items: previous.filter((item) => item.campaignId !== campaignId),
        error: null,
      });
      try {
        await campaignsApi.removeBookmark(campaignId);
      } catch (err) {
        setSnapshot({
          key: reloadCount,
          items: previous,
          error: getApiErrorMessage(err, 'No se pudo quitar el favorito.'),
        });
      }
    },
    [current, reloadCount],
  );

  return (
    <Card padding="md" className="brotar-followed-panel">
      <div className="brotar-followed-panel__head">
        <h2 className="brotar-followed-panel__title">
          <Bookmark size={18} /> Proyectos seguidos
        </h2>
        {onExplore ? (
          <Button size="sm" variant="outline" onClick={onExplore}>
            Explorar
          </Button>
        ) : null}
      </div>

      {isLoading ? <p className="page-subtitle">Cargando favoritos…</p> : null}
      {error ? (
        <p className="auth-error" role="alert">
          {error}{' '}
          <button type="button" className="link-btn" onClick={() => setReloadCount((n) => n + 1)}>
            Reintentar
          </button>
        </p>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="brotar-followed-panel__empty">
          <p>Aún no guardaste proyectos. Explora campañas y marca las que te interesen.</p>
          {onExplore ? (
            <Button size="md" variant="primary" onClick={onExplore}>
              Ir a Explorar
            </Button>
          ) : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="brotar-followed-list">
          {items.map((item) => (
            <li key={item.id} className="brotar-followed-item">
              {item.campaignCoverImageUrl ? (
                <img
                  src={item.campaignCoverImageUrl}
                  alt=""
                  className="brotar-followed-item__cover"
                />
              ) : (
                <div className="brotar-followed-item__cover brotar-followed-item__cover--empty" />
              )}
              <div className="brotar-followed-item__body">
                <button
                  type="button"
                  className="brotar-followed-item__title"
                  onClick={() => onOpenCampaign?.(item.campaignId)}
                >
                  {item.campaignTitle}
                </button>
                <p className="brotar-followed-item__meta">
                  {item.progressPercentage}% recaudado
                  {item.latestUpdateTitle
                    ? ` · Último avance: ${item.latestUpdateTitle}`
                    : ' · Sin avances públicos aún'}
                </p>
              </div>
              <div className="brotar-followed-item__actions">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenCampaign?.(item.campaignId)}
                >
                  <ExternalLink size={14} /> Ver
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  onClick={() => void handleRemove(item.campaignId)}
                >
                  Quitar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
};
