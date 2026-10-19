import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Country } from '../lib/types';

let countriesCache: { served: Country[]; all: string[] } | null = null;
const citiesCache = new Map<string, string[]>();

/**
 * Countries served by Waselni (managed in the site's admin panel) and the full world list
 * (for the user's own country), loaded once per app session.
 */
export function useCountries() {
  const { api } = useAuth();
  const [data, setData] = useState(countriesCache);
  useEffect(() => {
    if (countriesCache) return;
    Promise.all([api.get<Country[]>('/countries'), api.get<{ countries: string[] }>('/all-countries')])
      .then(([served, all]) => {
        countriesCache = { served, all: all.countries };
        setData(countriesCache);
      })
      .catch((error) => console.error('Error loading countries:', error));
  }, [api]);
  return {
    origins: (data?.served ?? []).filter((c) => c.is_origin !== false).map((c) => c.name),
    destinations: (data?.served ?? []).filter((c) => c.is_destination !== false).map((c) => c.name),
    served: (data?.served ?? []).map((c) => c.name),
    all: data?.all ?? [],
  };
}

/** Main cities of a country (empty list: free text). */
export function useCities(country: string | null) {
  const { api } = useAuth();
  const [cities, setCities] = useState<string[]>(country ? citiesCache.get(country) ?? [] : []);
  useEffect(() => {
    if (!country) { setCities([]); return; }
    const cached = citiesCache.get(country);
    if (cached) { setCities(cached); return; }
    api.get<{ cities: string[] }>(`/cities/${encodeURIComponent(country)}`)
      .then((res) => { citiesCache.set(country, res.cities); setCities(res.cities); })
      .catch(() => setCities([]));
  }, [api, country]);
  return cities;
}
