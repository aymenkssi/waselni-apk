import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ApiError } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Loads data from the API, reloads it each time the screen comes back into view,
 * and exposes pull-to-refresh state. `load` must be stable (useCallback).
 */
export function useQuery<T>(load: (() => Promise<T>) | null) {
  const { t } = useLanguage();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!load);
  const [refreshing, setRefreshing] = useState(false);
  const loaded = useRef(false);

  const run = useCallback(async (mode: 'initial' | 'refresh' | 'silent') => {
    if (!load) return;
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'initial') setLoading(true);
    try {
      setData(await load());
      setError(null);
      loaded.current = true;
    } catch (e) {
      setError(apiErrorText(e, t));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [load, t]);

  useEffect(() => {
    loaded.current = false;
    run('initial');
  }, [run]);

  // Coming back to the screen (after creating an item, for example) refreshes it quietly.
  useFocusEffect(useCallback(() => {
    if (loaded.current) run('silent');
  }, [run]));

  return { data, setData, error, loading, refreshing, refresh: () => run('refresh'), reload: () => run('silent') };
}

/** Message to show for a failed call: server message, or a translated network error. */
export function apiErrorText(e: unknown, t: (key: string) => string): string {
  if (e instanceof ApiError) {
    if (e.status === 0) return t('err_network');
    if (e.status >= 500) return t('err_server');
    return e.message;
  }
  return t('err_unknown');
}
