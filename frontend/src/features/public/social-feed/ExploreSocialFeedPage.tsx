import type { FC } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  LayoutGrid,
  Sprout,
  RefreshCw,
  AlertCircle,
  Compass,
} from 'lucide-react';
import {
  campaignsApi,
  type SocialFeedPost as SocialFeedPostType,
  type CampaignStoryItem,
  type CampaignResponse,
} from '../../../shared/api/campaignsApi.ts';
import { useAuth } from '../../auth/context/useAuth.ts';
import { StoriesTray } from './components/StoriesTray.tsx';
import { StoryViewerModal } from './components/StoryViewerModal.tsx';
import { CreateStoryModal } from './components/CreateStoryModal.tsx';
import { SocialFeedPost } from './components/SocialFeedPost.tsx';
import { SuggestedSidebar } from './components/SuggestedSidebar.tsx';
import { ExploreProjectsPage } from '../explore-projects/ExploreProjectsPage.tsx';
import { BrotinProcessLoader } from '../../../shared/components/index.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { useCampaignBookmarks } from '../../campaigns/hooks/useCampaignBookmarks.ts';
import './ExploreSocialFeedPage.css';

export interface ExploreSocialFeedPageProps {
  onSelectProject?: (projectId: string) => void;
  onNavigate?: (route: string) => void;
  initialMode?: 'feed' | 'catalog';
  /** Busqueda del header que llega al catalogo. */
  catalogQuery?: string | null;
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

const loadFeed = () => campaignsApi.getFeed(30);
const loadStories = () => campaignsApi.getStories(15);
const loadSuggested = () => campaignsApi.getSuggested(5);

interface SectionResult<T> {
  key: number;
  data: T | null;
  error: string | null;
}

/** Each feed section loads, fails and retries on its own; a failed retry keeps the last data. */
function useFeedSection<T>(load: () => Promise<T>, errorMessage: string) {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<SectionResult<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setResult({ key: reloadCount, data, error: null });
      },
      (err: unknown) => {
        if (!cancelled) {
          setResult((previous) => ({
            key: reloadCount,
            data: previous?.data ?? null,
            error: getApiErrorMessage(err, errorMessage),
          }));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, errorMessage, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const isCurrent = result?.key === reloadCount;

  return {
    data: result?.data ?? null,
    isLoading: !isCurrent,
    error: isCurrent ? result.error : null,
    reload,
  };
}

export const ExploreSocialFeedPage: FC<ExploreSocialFeedPageProps> = ({
  onSelectProject,
  onNavigate,
  initialMode = 'feed',
  catalogQuery = null,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [viewMode, setViewMode] = useState<'feed' | 'catalog'>(initialMode);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const feed = useFeedSection<SocialFeedPostType[]>(loadFeed, 'No se pudo cargar el feed social.');
  const storiesSection = useFeedSection<CampaignStoryItem[]>(
    loadStories,
    'No se pudieron cargar las historias.',
  );
  const suggested = useFeedSection<CampaignResponse[]>(
    loadSuggested,
    'No se pudieron cargar las sugerencias.',
  );
  const feedPosts = useMemo(() => feed.data ?? [], [feed.data]);
  const stories = storiesSection.data ?? [];
  const suggestedCampaigns = suggested.data ?? [];
  const isLoadingFeed = feed.isLoading && feed.data === null;
  const isLoadingStories = storiesSection.isLoading && storiesSection.data === null;

  const bookmarks = useCampaignBookmarks({ enabled: isAuthenticated });

  // Story Viewer & Story Creator Modal states
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

  const handleOpenCreateStory = () => {
    if (!isAuthenticated) {
      if (onNavigate) onNavigate('login');
      return;
    }
    setIsCreateStoryOpen(true);
  };

  const handleStoryCreated = () => {
    storiesSection.reload();
    feed.reload();
  };

  const handleToggleFavorite = (campaignId: string) => {
    if (!isAuthenticated) {
      onNavigate?.('login');
      return;
    }
    void bookmarks.toggle(campaignId);
  };

  const handleSelectCampaign = (campaignId: string) => {
    if (onSelectProject) {
      onSelectProject(campaignId);
    } else if (onNavigate) {
      onNavigate(`proyectos/${campaignId}`);
    }
  };

  const handleSponsorCampaign = (campaignId: string) => {
    if (onSelectProject) {
      onSelectProject(campaignId);
    } else if (onNavigate) {
      onNavigate(isAuthenticated ? 'sponsor' : 'login');
    }
  };

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return feedPosts;
    return feedPosts.filter(
      (p) => p.campaignCategory?.toLowerCase() === selectedCategory.toLowerCase(),
    );
  }, [feedPosts, selectedCategory]);

  return (
    <div className="brotar-explore-social-page">
      {/* Discrete Top Control Bar */}
      <div className="brotar-social-discrete-header">
        <div className="brotar-social-discrete-container">
          {/* Category Filter Chips Inline */}
          <div className="brotar-social-filter-row">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`brotar-social-filter-chip ${
                  selectedCategory === cat.id ? 'is-active' : ''
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Minimalist Discreet Mode Switcher Tabs */}
          <div className="brotar-view-toggle-bar">
            <button
              type="button"
              className={`brotar-view-tab ${viewMode === 'feed' ? 'is-active' : ''}`}
              onClick={() => setViewMode('feed')}
              title="Vista Feed Social"
            >
              <Sparkles size={15} />
              <span>Feed Social</span>
            </button>

            <button
              type="button"
              className={`brotar-view-tab ${viewMode === 'catalog' ? 'is-active' : ''}`}
              onClick={() => setViewMode('catalog')}
              title="Vista Catálogo Completo"
            >
              <LayoutGrid size={15} />
              <span>Catálogo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Feed Social */}
      {viewMode === 'feed' ? (
        <div className="brotar-social-feed-layout">
          {/* Main Feed Column */}
          <main className="brotar-social-main-column">
            {/* Horizontal Stories Carousel */}
            <StoriesTray
              stories={stories}
              isLoading={isLoadingStories}
              onSelectStory={(index) => setSelectedStoryIndex(index)}
              currentUserAvatarUrl={user?.avatarUrl}
              onCreateUpdate={handleOpenCreateStory}
            />

            {storiesSection.error && (
              <div className="brotar-social-error-banner" role="alert">
                <AlertCircle size={18} />
                <span>{storiesSection.error}</span>
                <button
                  type="button"
                  className="brotar-social-retry-btn"
                  onClick={storiesSection.reload}
                >
                  <RefreshCw size={14} /> Reintentar
                </button>
              </div>
            )}

            {feed.error && (
              <div className="brotar-social-error-banner" role="alert">
                <AlertCircle size={18} />
                <span>{feed.error}</span>
                <button type="button" className="brotar-social-retry-btn" onClick={feed.reload}>
                  <RefreshCw size={14} /> Reintentar
                </button>
              </div>
            )}

            {/* Loading State with Brotín Mascot Process Simulator */}
            {isLoadingFeed && (
              <BrotinProcessLoader
                variant="inline"
                title="Cargando tu feed verde"
                steps={[
                  'Preparando el huerto comunitario…',
                  'Conectando con proyectos e iniciativas sostenibles…',
                  'Cargando historias y novedades ecológicas…',
                  'Listo para florecer 🌱',
                ]}
              />
            )}

            {/* Empty State */}
            {!isLoadingFeed && !(feed.error && feed.data === null) && filteredPosts.length === 0 && (
              <div className="brotar-feed-empty-state">
                <Sprout size={48} className="brotar-feed-empty-icon" />
                <h3>No hay publicaciones en esta categoría aún</h3>
                <p>
                  Sé el primero en apoyar o revisar todos los proyectos en el catálogo.
                </p>
                <button
                  type="button"
                  className="brotar-feed-empty-btn"
                  onClick={() => setViewMode('catalog')}
                >
                  <Compass size={16} />
                  <span>Explorar Catálogo</span>
                </button>
              </div>
            )}

            {/* Feed Posts */}
            {!isLoadingFeed &&
              filteredPosts.map((post) => (
                <SocialFeedPost
                  key={post.id}
                  post={post}
                  onSelectCampaign={handleSelectCampaign}
                  onSponsorCampaign={handleSponsorCampaign}
                  isAuthenticated={isAuthenticated}
                  onRequireAuth={() => onNavigate && onNavigate('login')}
                  isSaved={bookmarks.savedIds.has(post.campaignId)}
                  onToggleSave={handleToggleFavorite}
                />
              ))}
          </main>

          {/* Right Sticky Sidebar on Desktop */}
          <div className="brotar-social-sidebar-column">
            {suggested.error && (
              <div className="brotar-social-error-banner" role="alert">
                <AlertCircle size={18} />
                <span>{suggested.error}</span>
                <button
                  type="button"
                  className="brotar-social-retry-btn"
                  onClick={suggested.reload}
                >
                  <RefreshCw size={14} /> Reintentar
                </button>
              </div>
            )}
            <SuggestedSidebar
              suggestedCampaigns={suggestedCampaigns}
              onSelectCampaign={handleSelectCampaign}
              onNavigate={(route) => onNavigate && onNavigate(route)}
            />
          </div>
        </div>
      ) : (
        /* Mode 2: Catalog View */
        <div className="brotar-social-catalog-wrapper">
          <ExploreProjectsPage
            onSelectProject={onSelectProject}
            onNavigate={onNavigate}
            initialQuery={catalogQuery}
            category={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStoryIndex !== null && stories.length > 0 && (
        <StoryViewerModal
          stories={stories}
          initialIndex={selectedStoryIndex}
          isOpen={selectedStoryIndex !== null}
          onClose={() => setSelectedStoryIndex(null)}
          onSelectCampaign={handleSelectCampaign}
        />
      )}

      {/* Story / Campaign Update Creator Modal */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onSuccess={handleStoryCreated}
        onNavigate={onNavigate}
      />
    </div>
  );
};
