import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCities } from '../hooks/usePlaces';
import { Field, Select } from './ui';

/** Country (from a list) then city (from the country's main cities, or typed when the list is empty). */
export const PlaceFields: React.FC<{
  countryLabel: string; cityLabel: string; countries: string[];
  country: string; city: string; onCountry: (c: string) => void; onCity: (c: string) => void;
  countryError?: string; cityError?: string; testID?: string;
}> = ({ countryLabel, cityLabel, countries, country, city, onCountry, onCity, countryError, cityError, testID }) => {
  const { t } = useLanguage();
  const cities = useCities(country || null);
  const other = t('other_city');
  return (
    <>
      <Select label={countryLabel} value={country || null} options={countries} display={(c) => c} searchable placeholder={t('choose')}
        onChange={(c) => { if (c !== country) { onCountry(c); onCity(''); } }} error={countryError} testID={testID ? `${testID}-country` : undefined} />
      {cities.length > 0 && (city === '' || cities.includes(city)) ? (
        <Select label={cityLabel} value={city || null} options={[...cities, other]} display={(c) => c} searchable placeholder={t('choose')}
          onChange={(c) => onCity(c === other ? ' ' : c)} error={cityError} testID={testID ? `${testID}-city` : undefined} />
      ) : (
        <Field label={cityLabel} value={city.trimStart()} onChangeText={onCity} error={cityError} autoCapitalize="words" testID={testID ? `${testID}-city` : undefined} />
      )}
    </>
  );
};
