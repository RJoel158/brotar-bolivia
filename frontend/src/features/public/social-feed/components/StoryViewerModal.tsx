import type { FC } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sprout,
  Heart,
  Share2,
  CheckCircle2,
  Play,
  Pause,
} from 'lucide-react';
import type { CampaignStoryItem } from '../../../../shared/api/campaignsApi.ts';
import { useToast } from '../../../../shared/context/ToastContext.tsx';
import './StoryViewerModal.css';

export interface StoryViewerModalProps {
  stories: CampaignStoryItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectCampaign: (campaignId: string) => void;
}

const STORY_DURATION_MS = 6000;

function formatStoryTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return 'Hace 1 h';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${Math.max(1, mins)} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  } catch {
    return 'Hace 1 h';
  }
}

export const StoryViewerModal: FC<StoryViewerModalProps> = ({
  stories,
  initialIndex,
  isOpen,
  onClose,
  onSelectCampaign,
}) => {
  const toast = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedProgressRef = useRef<number>(0);

  // Sync index with initialIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, stories.length - 1)));
      setProgress(0);
      pausedProgressRef.current = 0;
      setIsLiked(false);
    }
  }, [isOpen, initialIndex, stories.length]);

  const currentStory = stories[currentIndex];
  const prevStory = currentIndex > 0 ? stories[currentIndex - 1] : null;
  const nextStory = currentIndex < stories.length - 1 ? stories[currentIndex + 1] : null;

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      pausedProgressRef.current = 0;
      setIsLiked(false);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      pausedProgressRef.current = 0;
      setIsLiked(false);
    } else {
      setProgress(0);
      pausedProgressRef.current = 0;
    }
  }, [currentIndex]);

  // Story progress timer
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      return;
    }

    startTimeRef.current = performance.now() - (pausedProgressRef.current / 100) * STORY_DURATION_MS;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const newProgress = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(newProgress);
      pausedProgressRef.current = newProgress;

      if (newProgress >= 100) {
        handleNext();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [isOpen, currentStory, currentIndex, isPaused, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !currentStory) {
    return null;
  }

  const handleOpenCampaign = () => {
    onClose();
    onSelectCampaign(currentStory.campaignId);
  };

  const handleShareStory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/campana/${currentStory.campaignId}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('Enlace de la campaña copiado al portapapeles', '¡Listo!');
      }
    } catch {
      toast.info('No se pudo copiar el enlace', 'Aviso');
    }
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked((prev) => !prev);
  };

  const imageSrc =
    currentStory.coverImageUrl ||
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80';

  return (
    <div
      className="brotar-story-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Historia de ${currentStory.creatorName}`}
    >
      {/* Top Header Bar with Logo and Close Button */}
      <header className="brotar-story-top-brand-bar">
        <div className="brotar-story-brand-logo">
          <Sprout size={20} className="brotar-story-brand-icon" />
          <span>Brotar</span>
        </div>

        <button
          type="button"
          className="brotar-story-close-btn"
          onClick={onClose}
          aria-label="Cerrar historias"
        >
          <X size={24} />
        </button>
      </header>

      {/* Main Desktop Stage / Mobile Fullscreen */}
      <div className="brotar-story-viewer-stage">
        {/* Previous Story Preview Card (Desktop) */}
        {prevStory ? (
          <div
            className="brotar-story-preview-card is-prev"
            onClick={handlePrev}
            role="button"
            tabIndex={0}
            title={`Historia anterior: ${prevStory.creatorName}`}
          >
            <div className="brotar-story-preview-bg-wrap">
              <img
                src={
                  prevStory.coverImageUrl ||
                  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80'
                }
                alt={prevStory.creatorName}
                className="brotar-story-preview-bg"
              />
              <div className="brotar-story-preview-scrim" />
            </div>

            <div className="brotar-story-preview-content">
              <div className="brotar-story-preview-avatar-ring">
                {prevStory.creatorAvatarUrl ? (
                  <img
                    src={prevStory.creatorAvatarUrl}
                    alt={prevStory.creatorName}
                    className="brotar-story-preview-avatar-img"
                  />
                ) : (
                  <Sprout size={20} color="#0e4b34" />
                )}
              </div>
              <span className="brotar-story-preview-name">{prevStory.creatorName}</span>
              <span className="brotar-story-preview-time">
                {formatStoryTimeAgo(prevStory.createdAt)}
              </span>
            </div>
          </div>
        ) : (
          <div className="brotar-story-preview-placeholder is-prev" />
        )}

        {/* Left Navigation Arrow */}
        <button
          type="button"
          className="brotar-story-nav-btn brotar-story-nav-left"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Historia anterior"
        >
          <ChevronLeft size={26} strokeWidth={2.4} />
        </button>

        {/* Active Mobile-Style Story Card */}
        <div
          className="brotar-story-card"
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerLeave={() => setIsPaused(false)}
        >
          {/* Progress Segment Bars */}
          <div className="brotar-story-progress-row">
            {stories.map((s, idx) => {
              let barWidth = 0;
              if (idx < currentIndex) barWidth = 100;
              else if (idx === currentIndex) barWidth = progress;

              return (
                <div key={s.id || idx} className="brotar-story-progress-bar-bg">
                  <div
                    className="brotar-story-progress-bar-fill"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Story Header (Avatar, Name, Tag, Time Ago, Pause) */}
          <div className="brotar-story-header">
            <div className="brotar-story-creator-info">
              <div className="brotar-story-header-avatar">
                {currentStory.creatorAvatarUrl ? (
                  <img
                    src={currentStory.creatorAvatarUrl}
                    alt={currentStory.creatorName}
                    className="brotar-story-header-avatar-img"
                  />
                ) : (
                  <Sprout size={16} color="#0e4b34" />
                )}
              </div>

              <div className="brotar-story-header-meta">
                <div className="brotar-story-header-name-row">
                  <span className="brotar-story-header-name">{currentStory.creatorName}</span>
                  <CheckCircle2 size={13} className="brotar-story-verified-check" />
                  <span className="brotar-story-header-dot">•</span>
                  <span className="brotar-story-header-time">
                    {formatStoryTimeAgo(currentStory.createdAt)}
                  </span>
                </div>
                <span className="brotar-story-header-category">{currentStory.category}</span>
              </div>
            </div>

            <div className="brotar-story-header-actions">
              <button
                type="button"
                className="brotar-story-header-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((p) => !p);
                }}
                aria-label={isPaused ? 'Reanudar historia' : 'Pausar historia'}
                title={isPaused ? 'Reanudar' : 'Pausar'}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            </div>
          </div>

          {/* Story Media Center */}
          <div className="brotar-story-media-wrap">
            <img
              src={imageSrc}
              alt={currentStory.campaignTitle}
              className="brotar-story-media-image"
            />
            <div className="brotar-story-media-gradient" />
          </div>

          {/* Touch Zones (Tap Left / Right) */}
          <div
            className="brotar-story-tap-zone brotar-story-tap-left"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Anterior"
          />
          <div
            className="brotar-story-tap-zone brotar-story-tap-right"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Siguiente"
          />

          {/* Story Bottom Content Overlay */}
          <div className="brotar-story-bottom-overlay">
            {/* Project Pill & Update Info */}
            <div className="brotar-story-card-info">
              {/* Campaign / Project Mini Banner */}
              <div className="brotar-story-project-pill" onClick={handleOpenCampaign}>
                <Sprout size={14} className="brotar-story-pill-icon" />
                <span className="brotar-story-pill-title">{currentStory.campaignTitle}</span>
                <span className="brotar-story-pill-progress">
                  {currentStory.progressPercentage}%
                </span>
              </div>

              {/* Text Caption if present */}
              {currentStory.latestUpdateTitle && (
                <div className="brotar-story-caption-card">
                  <h4 className="brotar-story-caption-title">{currentStory.latestUpdateTitle}</h4>
                  {currentStory.latestUpdateBody && (
                    <p className="brotar-story-caption-body">{currentStory.latestUpdateBody}</p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Row (Instagram-Style) */}
            <div className="brotar-story-actions-row">
              <button
                type="button"
                className="brotar-story-primary-cta"
                onClick={handleOpenCampaign}
              >
                <span>Apoyar proyecto</span>
                <ExternalLink size={15} />
              </button>

              <button
                type="button"
                className={`brotar-story-action-icon-btn ${isLiked ? 'is-liked' : ''}`}
                onClick={handleToggleLike}
                aria-label="Me gusta esta historia"
                title="Me gusta"
              >
                <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#ffffff'} />
              </button>

              <button
                type="button"
                className="brotar-story-action-icon-btn"
                onClick={handleShareStory}
                aria-label="Compartir historia"
                title="Compartir"
              >
                <Share2 size={20} color="#ffffff" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Navigation Arrow */}
        <button
          type="button"
          className="brotar-story-nav-btn brotar-story-nav-right"
          onClick={handleNext}
          aria-label="Siguiente historia"
        >
          <ChevronRight size={26} strokeWidth={2.4} />
        </button>

        {/* Next Story Preview Card (Desktop) */}
        {nextStory ? (
          <div
            className="brotar-story-preview-card is-next"
            onClick={handleNext}
            role="button"
            tabIndex={0}
            title={`Siguiente historia: ${nextStory.creatorName}`}
          >
            <div className="brotar-story-preview-bg-wrap">
              <img
                src={
                  nextStory.coverImageUrl ||
                  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80'
                }
                alt={nextStory.creatorName}
                className="brotar-story-preview-bg"
              />
              <div className="brotar-story-preview-scrim" />
            </div>

            <div className="brotar-story-preview-content">
              <div className="brotar-story-preview-avatar-ring">
                {nextStory.creatorAvatarUrl ? (
                  <img
                    src={nextStory.creatorAvatarUrl}
                    alt={nextStory.creatorName}
                    className="brotar-story-preview-avatar-img"
                  />
                ) : (
                  <Sprout size={20} color="#0e4b34" />
                )}
              </div>
              <span className="brotar-story-preview-name">{nextStory.creatorName}</span>
              <span className="brotar-story-preview-time">
                {formatStoryTimeAgo(nextStory.createdAt)}
              </span>
            </div>
          </div>
        ) : (
          <div className="brotar-story-preview-placeholder is-next" />
        )}
      </div>
    </div>
  );
};
