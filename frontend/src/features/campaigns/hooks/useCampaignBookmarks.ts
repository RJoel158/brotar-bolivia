import { useCallback, useEffect, useState } from 'react';
import { campaignsApi } from '../../../shared/api/campaignsApi.ts';

interface UseCampaignBookmarksOptions {
  enabled?: boolean;
}

interface BookmarkSnapshot {
  key: number;
  ids: string[];
  error: string | null;
}

export function useCampaignBookmarks({ enabled = true }: UseCampaignBookmarksOptions = {}) {
  const [reloadCount, setReloadCount] = useState(0);
  const [snapshot, setSnapshot] = useState<BookmarkSnapshot | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    void campaignsApi.listMyBookmarkIds().then(
      (ids) => {
        if (!cancelled) {
          setSnapshot({ key: reloadCount, ids, error: null });
        }
      },
      () => {
        if (!cancelled) {
          setSnapshot({
            key: reloadCount,
            ids: [],
            error: 'No se pudieron cargar tus favoritos.',
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, reloadCount]);

  const current = enabled && snapshot?.key === reloadCount ? snapshot : null;
  const savedIds = new Set(current?.ids ?? []);
  const isLoading = enabled && current === null;
  const error = enabled ? (current?.error ?? null) : null;

  const refresh = useCallback(() => {
    setReloadCount((count) => count + 1);
  }, []);

  const toggle = useCallback(
    async (campaignId: string) => {
      if (!enabled || !current) return false;
      const currentlySaved = current.ids.includes(campaignId);
      const nextIds = currentlySaved
        ? current.ids.filter((id) => id !== campaignId)
        : [...current.ids, campaignId];
      setSnapshot({ key: reloadCount, ids: nextIds, error: null });
      try {
        if (currentlySaved) {
          await campaignsApi.removeBookmark(campaignId);
        } else {
          await campaignsApi.addBookmark(campaignId);
        }
        return !currentlySaved;
      } catch {
        setSnapshot({
          key: reloadCount,
          ids: current.ids,
          error: 'No se pudo actualizar el favorito.',
        });
        return currentlySaved;
      }
    },
    [enabled, current, reloadCount],
  );

  return { savedIds, isLoading, error, toggle, refresh };
}
