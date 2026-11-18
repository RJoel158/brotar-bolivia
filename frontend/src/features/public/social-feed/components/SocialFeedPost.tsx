import type { FC } from 'react';
import { useState } from 'react';
import {
  Bookmark,
  Share2,
  CheckCircle2,
  Sprout,
  Users,
  ArrowRight,
  Heart,
} from 'lucide-react';
import type { SocialFeedPost as SocialFeedPostType } from '../../../../shared/api/campaignsApi.ts';
import { formatCurrency } from '../../../../shared/index.ts';
import './SocialFeedPost.css';

interface SocialFeedPostProps {
  post: SocialFeedPostType;
  onSelectCampaign: (campaignId: string) => void;
  onSponsorCampaign?: (campaignId: string) => void;
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
  isSaved?: boolean;
  onToggleSave?: (campaignId: string) => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatPostDate(dateStr: string): string {
  try {
    return DATE_FORMATTER.format(new Date(dateStr));
  } catch {
    return 'Reciente';
  }
}

export const SocialFeedPost: FC<SocialFeedPostProps> = ({
  post,
  onSelectCampaign,
  onSponsorCampaign,
  isAuthenticated = false,
  onRequireAuth,
  isSaved = false,
  onToggleSave,
}) => {
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const localSaved = optimisticSaved ?? isSaved;

  const handleToggleFavorite = () => {
    if (!isAuthenticated && onRequireAuth) {
      onRequireAuth();
      return;
    }
    const nextState = !localSaved;
    setOptimisticSaved(nextState);
    if (onToggleSave) {
      onToggleSave(post.campaignId);
    }
  };

  const handleDoubleTap = () => {
    if (!isAuthenticated && onRequireAuth) {
      onRequireAuth();
      return;
    }
    if (!localSaved) {
      setOptimisticSaved(true);
      if (onToggleSave) {
        onToggleSave(post.campaignId);
      }
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/proyectos/${post.campaignId}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const isLongBody = post.body.length > 180;
  const displayBody = showFullCaption || !isLongBody
    ? post.body
    : `${post.body.slice(0, 180)}…`;

  const coverSrc = post.imageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80';

  return (
    <article className="brotar-feed-card">
      {/* Post Header */}
      <header className="brotar-feed-header">
        <div className="brotar-feed-header-left">
          <div className="brotar-feed-avatar-wrap">
            {post.creator.avatarUrl ? (
              <img
                src={post.creator.avatarUrl}
                alt={post.creator.fullName}
                className="brotar-feed-avatar-img"
              />
            ) : (
              <div className="brotar-feed-avatar-fallback">
                <Sprout size={16} />
              </div>
            )}
          </div>
          <div className="brotar-feed-meta">
            <div className="brotar-feed-creator-row">
              <span className="brotar-feed-creator-name">{post.creator.fullName}</span>
              {post.creator.isVerified && (
                <CheckCircle2 size={14} className="brotar-feed-verified-badge" />
              )}
            </div>
            <div className="brotar-feed-sub-row">
              <button
                type="button"
                className="brotar-feed-campaign-link"
                onClick={() => onSelectCampaign(post.campaignId)}
              >
                {post.campaignTitle}
              </button>
              <span className="brotar-feed-dot">•</span>
              <span className="brotar-feed-time">{formatPostDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="brotar-feed-header-right">
          <span className="brotar-feed-category-pill">{post.campaignCategory}</span>
        </div>
      </header>

      {/* Post Media with Double Tap Favorite */}
      <div className="brotar-feed-media-container" onDoubleClick={handleDoubleTap}>
        <img
          src={coverSrc}
          alt={post.title}
          className="brotar-feed-media-img"
          loading="lazy"
        />

        {/* Floating Sprout Heart Animation on Double Tap */}
        {showHeartAnim && (
          <div className="brotar-feed-doubletap-heart">
            <Heart size={64} fill="#8cc63f" color="#ffffff" />
          </div>
        )}

        {/* Post Type Badge overlay */}
        {post.type === 'update' && (
          <span className="brotar-feed-type-badge">
            Avance del Proyecto
          </span>
        )}
      </div>

      {/* Campaign Funding Progress Bar */}
      <div className="brotar-feed-funding-bar-box">
        <div className="brotar-feed-funding-info">
          <div className="brotar-feed-funding-raised">
            <span className="brotar-feed-funding-current">
              {formatCurrency(post.metrics.currentAmount, post.metrics.currency)}
            </span>
            <span className="brotar-feed-funding-goal">
              de {formatCurrency(post.metrics.goalAmount, post.metrics.currency)}
            </span>
          </div>
          <div className="brotar-feed-funding-stat-right">
            <span className="brotar-feed-funding-percent">
              {post.metrics.percentage}%
            </span>
            <span className="brotar-feed-funding-backers">
              <Users size={13} />
              {post.metrics.backersCount} apoyos
            </span>
          </div>
        </div>
        <div className="brotar-feed-progress-track">
          <div
            className="brotar-feed-progress-fill"
            style={{ width: `${Math.min(100, post.metrics.percentage)}%` }}
          />
        </div>
      </div>

      {/* Caption & Content (Title & body above action bar for natural reading flow) */}
      <div className="brotar-feed-caption-box">
        <h3 className="brotar-feed-post-title">{post.title}</h3>
        <p className="brotar-feed-post-body">
          {displayBody}{' '}
          {isLongBody && (
            <button
              type="button"
              className="brotar-feed-more-btn"
              onClick={() => setShowFullCaption((prev) => !prev)}
            >
              {showFullCaption ? 'ver menos' : 'más'}
            </button>
          )}
        </p>
      </div>

      {/* Action Bar (Clean: Favorite Campaign + Share + Support CTA) */}
      <div className="brotar-feed-action-bar">
        <div className="brotar-feed-actions-left">
          <button
            type="button"
            className={`brotar-feed-action-btn ${localSaved ? 'is-saved' : ''}`}
            onClick={handleToggleFavorite}
            aria-label={localSaved ? 'Guardado en favoritos' : 'Guardar campaña'}
          >
            <Bookmark
              size={19}
              fill={localSaved ? '#0e4b34' : 'none'}
              color={localSaved ? '#0e4b34' : '#334155'}
            />
            <span className="brotar-feed-btn-label">
              {localSaved ? 'Siguiendo' : 'Guardar'}
            </span>
          </button>

          <button
            type="button"
            className="brotar-feed-action-btn brotar-feed-share-btn"
            onClick={handleShare}
            aria-label="Compartir proyecto"
          >
            <Share2 size={18} color="#334155" />
            <span className="brotar-feed-btn-label">Compartir</span>
            {copiedToast && <span className="brotar-feed-copied-toast">¡Enlace copiado!</span>}
          </button>
        </div>

        <div className="brotar-feed-actions-right">
          <button
            type="button"
            className="brotar-feed-support-cta"
            onClick={() => {
              if (onSponsorCampaign) {
                onSponsorCampaign(post.campaignId);
              } else {
                onSelectCampaign(post.campaignId);
              }
            }}
          >
            <span>Apoyar proyecto</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
};
