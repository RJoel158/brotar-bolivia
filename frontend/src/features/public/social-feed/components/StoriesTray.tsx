import type { FC } from 'react';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sprout, Plus } from 'lucide-react';
import type { CampaignStoryItem } from '../../../../shared/api/campaignsApi.ts';
import './StoriesTray.css';

interface StoriesTrayProps {
  stories: CampaignStoryItem[];
  isLoading?: boolean;
  onSelectStory: (index: number) => void;
  onCreateUpdate?: () => void;
  currentUserAvatarUrl?: string | null;
}

function formatStoryDisplayName(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return name;
}

export const StoriesTray: FC<StoriesTrayProps> = ({
  stories,
  isLoading = false,
  onSelectStory,
  onCreateUpdate,
  currentUserAvatarUrl = null,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <div className="brotar-stories-tray-container">
        <div className="brotar-stories-tray">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="brotar-story-item-skeleton">
              <div className="brotar-story-ring-skeleton" />
              <div className="brotar-story-label-skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stories.length === 0 && !onCreateUpdate) {
    return null;
  }

  return (
    <div className="brotar-stories-tray-container">
      {/* Scroll Left Button */}
      <button
        type="button"
        className="brotar-story-scroll-btn brotar-story-scroll-left"
        onClick={() => handleScroll('left')}
        aria-label="Desplazar a la izquierda"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Stories Scroll Container */}
      <div className="brotar-stories-tray" ref={scrollRef}>
        {/* "Tu historia" / Upload Story Button */}
        {onCreateUpdate && (
          <button
            type="button"
            className="brotar-story-item brotar-story-create-btn"
            onClick={onCreateUpdate}
            aria-label="Subir una historia o avance"
            title="Subir una historia o avance"
          >
            <div className="brotar-story-avatar-wrapper">
              <div className="brotar-story-avatar-inner" style={{ background: '#f4faf6' }}>
                {currentUserAvatarUrl ? (
                  <img
                    src={currentUserAvatarUrl}
                    alt="Tu foto de perfil"
                    className="brotar-story-img"
                  />
                ) : (
                  <div className="brotar-story-placeholder">
                    <Sprout size={20} color="#0e4b34" />
                  </div>
                )}
              </div>
              <div className="brotar-story-plus-badge">
                <Plus size={13} strokeWidth={3} />
              </div>
            </div>
            <span className="brotar-story-name">Tu historia</span>
          </button>
        )}

        {/* Stories list */}
        {stories.map((story, index) => {
          const avatarUrl = story.creatorAvatarUrl || story.coverImageUrl;
          const rawName = story.creatorName || story.campaignTitle;
          const displayName = formatStoryDisplayName(rawName);

          return (
            <button
              key={story.id || story.campaignId || index}
              type="button"
              className={`brotar-story-item ${story.isUnread ? 'is-unread' : 'is-viewed'}`}
              onClick={() => onSelectStory(index)}
              title={`${rawName}: ${story.latestUpdateTitle || story.campaignTitle}`}
            >
              <div className="brotar-story-avatar-wrapper">
                <div className="brotar-story-ring">
                  <div className="brotar-story-avatar-inner">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={rawName}
                        className="brotar-story-img"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to placeholder if image fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="brotar-story-placeholder">
                        <Sprout size={20} className="brotar-story-fallback-icon" />
                      </div>
                    )}
                  </div>
                </div>
                {story.progressPercentage >= 100 && (
                  <span className="brotar-story-completed-badge" title="¡Meta alcanzada!">
                    100%
                  </span>
                )}
              </div>
              <span className="brotar-story-name">{displayName}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        type="button"
        className="brotar-story-scroll-btn brotar-story-scroll-right"
        onClick={() => handleScroll('right')}
        aria-label="Desplazar a la derecha"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
