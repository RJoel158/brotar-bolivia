import type { FC } from 'react';
import { useState } from 'react';
import {
  Megaphone,
  Lock,
  Globe,
  Trash2,
  PlusCircle,
  Clock,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { Button, Card } from '../../../shared/index.ts';
import type { CampaignUpdateItem } from '../../../shared/api/campaignsApi.ts';
import { campaignsApi } from '../../../shared/api/campaignsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import './CampaignUpdatesFeed.css';

export interface CampaignUpdatesFeedProps {
  campaignId: string;
  updates: CampaignUpdateItem[];
  isOwner?: boolean;
  canPostUpdate?: boolean;
  onUpdateCreated?: () => void;
  onOpenCreateModal?: () => void;
}

export const CampaignUpdatesFeed: FC<CampaignUpdatesFeedProps> = ({
  campaignId,
  updates,
  isOwner = false,
  canPostUpdate = false,
  onOpenCreateModal,
  onUpdateCreated,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async (updateId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este avance?')) {
      return;
    }
    setDeletingId(updateId);
    setActionError(null);
    try {
      await campaignsApi.deleteUpdate(campaignId, updateId);
      onUpdateCreated?.();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'No se pudo eliminar la actualización.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="campaign-updates-feed">
      <div className="campaign-updates-feed__header">
        <div>
          <h2 className="campaign-updates-feed__title">Avances y Novedades</h2>
          <p className="campaign-updates-feed__subtitle">
            Comunicados oficiales y progresos compartidos por el equipo del proyecto.
          </p>
        </div>
        {canPostUpdate ? (
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenCreateModal}
            className="campaign-updates-feed__post-btn"
          >
            <PlusCircle size={16} className="btn-icon" />
            Publicar avance
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <div className="campaign-updates-feed__alert" role="alert">
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      ) : null}

      {updates.length === 0 ? (
        <Card className="campaign-updates-feed__empty" padding="lg">
          <div className="campaign-updates-feed__empty-icon">
            <Megaphone size={36} />
          </div>
          <h3 className="campaign-updates-feed__empty-title">Aún no hay avances publicados</h3>
          <p className="campaign-updates-feed__empty-text">
            El creador publicará fotos, hitos logrados y avisos sobre el desarrollo de la campaña en esta sección.
          </p>
          {canPostUpdate ? (
            <Button size="sm" variant="secondary" onClick={onOpenCreateModal}>
              <PlusCircle size={16} className="btn-icon" />
              Crear primera publicación
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="campaign-updates-feed__timeline">
          {updates.map((item) => {
            const isSupportersOnly = item.visibility === 'supporters_only';
            const publishedDate = item.publishedAt || item.createdAt;
            const formattedDate = new Date(publishedDate).toLocaleDateString('es-BO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <article key={item.id} className="campaign-update-card">
                <div className="campaign-update-card__top">
                  <div className="campaign-update-card__author">
                    <div className="campaign-update-card__avatar">
                      {item.authorAvatarUrl ? (
                        <img src={item.authorAvatarUrl} alt="" />
                      ) : (
                        <UserCheck size={18} />
                      )}
                    </div>
                    <div>
                      <span className="campaign-update-card__author-name">
                        {item.authorName || 'Creador del Proyecto'}
                      </span>
                      <div className="campaign-update-card__date">
                        <Clock size={13} />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="campaign-update-card__badges">
                    {isSupportersOnly ? (
                      <span className="update-badge update-badge--supporters">
                        <Lock size={12} />
                        Solo Patrocinadores
                      </span>
                    ) : (
                      <span className="update-badge update-badge--public">
                        <Globe size={12} />
                        Público
                      </span>
                    )}

                    {isOwner ? (
                      <button
                        type="button"
                        className="campaign-update-card__delete-btn"
                        title="Eliminar avance"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <h3 className="campaign-update-card__heading">{item.title}</h3>
                <p className="campaign-update-card__body">{item.body}</p>

                {item.imageUrl ? (
                  <div className="campaign-update-card__media">
                    <img src={item.imageUrl} alt={item.title} loading="lazy" />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
