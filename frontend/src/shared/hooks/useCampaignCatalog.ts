import { useCallback, useEffect, useRef, useState } from 'react';
import { campaignsApi, type CampaignResponse } from '../api/campaignsApi.ts';
import { getApiErrorMessage } from '../../features/auth/utils/getApiErrorMessage.ts';

interface CatalogState {
  key: string; items: CampaignResponse[]; nextCursor: string | null;
  isLoading: boolean; isLoadingMore: boolean; error: string | null; loadMoreError: string | null;
}
export function useCampaignCatalog(category?: string, query = '') {
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([category ?? '', query.trim(), revision]);
  const refresh = useCallback(() => setRevision(n => n + 1), []);
  const generation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const loadingMore = useRef(false);
  const [state, setState] = useState<CatalogState>({ key: '', items: [], nextCursor: null, isLoading: true, isLoadingMore: false, error: null, loadMoreError: null });
  useEffect(() => {
    const version = ++generation.current;
    pending.current?.abort();
    loadingMore.current = false;
    const controller = new AbortController();
    pending.current = controller;
    setState({ key, items: [], nextCursor: null, isLoading: true, isLoadingMore: false, error: null, loadMoreError: null });
    void campaignsApi.listCatalog({ category, query: query.trim() || undefined }, controller.signal).then(page => {
      if (version === generation.current && !controller.signal.aborted) setState(s => ({ ...s, ...page, isLoading: false }));
    }).catch(error => {
      if (version === generation.current && !controller.signal.aborted) setState(s => ({ ...s, isLoading: false, error: getApiErrorMessage(error, 'No se pudieron cargar los proyectos.') }));
    });
    return () => { ++generation.current; pending.current?.abort(); };
  }, [key, category, query]);
  const loadMore = useCallback(async () => {
    if (state.key !== key || state.isLoading || loadingMore.current || !state.nextCursor) return;
    const version = generation.current;
    loadingMore.current = true;
    const controller = new AbortController();
    pending.current = controller;
    setState(s => ({ ...s, isLoadingMore: true, loadMoreError: null }));
    try {
      const page = await campaignsApi.listCatalog({ category, query: query.trim() || undefined, cursor: state.nextCursor }, controller.signal);
      if (version === generation.current && !controller.signal.aborted) setState(s => ({ ...s, items: [...s.items, ...page.items], nextCursor: page.nextCursor, isLoadingMore: false }));
    } catch (error) {
      if (version === generation.current && !controller.signal.aborted) setState(s => ({ ...s, isLoadingMore: false, loadMoreError: getApiErrorMessage(error, 'No se pudieron cargar mas proyectos.') }));
    } finally { if (version === generation.current) loadingMore.current = false; }
  }, [state.key, state.isLoading, state.nextCursor, key, category, query]);
  return { ...state, items: state.key === key ? state.items : [], isLoading: state.key !== key || state.isLoading, loadMore, refresh };
}
