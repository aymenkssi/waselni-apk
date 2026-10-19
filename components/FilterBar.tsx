import React, { useState } from 'react';
import { View } from 'react-native';
import { SPACING } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useCountries } from '../hooks/usePlaces';
import { ShippingMode } from '../lib/types';
import { Button, Chip, HScroll, Select, Sheet } from './ui';

export interface Filters { origin_country: string; destination_country: string; mode: ShippingMode | '' }
export const NO_FILTERS: Filters = { origin_country: '', destination_country: '', mode: '' };

/** Filter chips (from, to, mode) above the offer and request lists. */
export const FilterBar: React.FC<{ value: Filters; onChange: (f: Filters) => void }> = ({ value, onChange }) => {
  const { t } = useLanguage();
  const { origins, destinations } = useCountries();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const active = !!(value.origin_country || value.destination_country || value.mode);
  const show = () => { setDraft(value); setOpen(true); };
  const any = t('any');
  return (
    <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
      <HScroll>
        <Chip icon="options-outline" label={t('filters')} selected={active} onPress={show} testID="filters" />
        <Chip icon="navigate-outline" label={value.origin_country || t('from_anywhere')} selected={!!value.origin_country} onPress={show} />
        <Chip icon="flag-outline" label={value.destination_country || t('to_anywhere')} selected={!!value.destination_country} onPress={show} />
        <Chip icon="car-outline" label={t('mode_road')} selected={value.mode === 'TERRESTRIAL'} onPress={() => onChange({ ...value, mode: value.mode === 'TERRESTRIAL' ? '' : 'TERRESTRIAL' })} />
        <Chip icon="airplane-outline" label={t('mode_air')} selected={value.mode === 'AIR'} onPress={() => onChange({ ...value, mode: value.mode === 'AIR' ? '' : 'AIR' })} />
        {active && <Chip icon="close" label={t('clear')} onPress={() => onChange(NO_FILTERS)} />}
      </HScroll>
      <Sheet visible={open} onClose={() => setOpen(false)} title={t('filters')}>
        <Select label={t('origin_country')} value={draft.origin_country || any} options={[any, ...origins]} display={(c) => c} searchable
          onChange={(c) => setDraft({ ...draft, origin_country: c === any ? '' : c })} />
        <Select label={t('destination_country')} value={draft.destination_country || any} options={[any, ...destinations]} display={(c) => c} searchable
          onChange={(c) => setDraft({ ...draft, destination_country: c === any ? '' : c })} />
        <Button label={t('apply')} icon="checkmark" onPress={() => { onChange(draft); setOpen(false); }} testID="filters-apply" />
      </Sheet>
    </View>
  );
};

/** Same filters applied on the phone (some API versions ignore them). */
export function matchesFilters(item: { origin_country: string; destination_country: string; mode: ShippingMode }, f: Filters): boolean {
  return (!f.origin_country || item.origin_country === f.origin_country)
    && (!f.destination_country || item.destination_country === f.destination_country)
    && (!f.mode || item.mode === f.mode);
}
