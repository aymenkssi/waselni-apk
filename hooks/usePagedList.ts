import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Paginated } from '../lib/types';
import { apiErrorText } from './useQuery';

/** Paged list from the API (page / pages), with pull-to-refresh and "load more" at the end of the list. */
export function usePagedList<T extends { id: string }>(load: (page: number) => Promise<Paginated<T>>) {
  const { t } = useLanguage();
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ignores answers to an older request (filters changed while loading).
  const generation = useRef(0);

  const fetchPage = useCallback(async (p: number, mode: 'initial' | 'refresh' | 'more') => {
    const gen = mode === 'more' ? generation.current : ++generation.current;
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'more') setLoadingMore(true);
    try {
      const res = await load(p);
      if (gen !== generation.current) return;
      setItems((prev) => {
        if (p === 1) return res.items;
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...res.items.filter((i) => !seen.has(i.id))];
      });
      setPage(p);
      setPages(res.pages ?? 1);
      setTotal(res.total);
      setError(null);
    } catch (e) {
      if (gen === generation.current) setError(apiErrorText(e, t));
    } finally {
      if (gen === generation.current) { setLoading(false); setRefreshing(false); setLoadingMore(false); }
    }
  }, [load, t]);

  useEffect(() => { fetchPage(1, 'initial'); }, [fetchPage]);

  return {
    items, total, loading, refreshing, loadingMore, error,
    refresh: () => fetchPage(1, 'refresh'),
    loadMore: () => { if (!loadingMore && !loading && page < pages) fetchPage(page + 1, 'more'); },
  };
}
