import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ShippingMode } from '../lib/types';
import { useRow } from './ui';

interface Route { origin_city?: string; origin_country?: string; destination_city?: string; destination_country?: string; mode?: ShippingMode }

/** "Paris (France) → Tunis (Tunisie)" with the transport mode icon. */
export const RouteLine: React.FC<{ route: Route; large?: boolean }> = ({ route, large }) => {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();
  const row = useRow();
  const place = (city?: string, country?: string) => (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: large ? FONT.xl : FONT.lg, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>{city || '—'}</Text>
      {!!country && <Text style={{ color: colors.textSecondary, fontSize: FONT.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>{country}</Text>}
    </View>
  );
  return (
    <View style={[row, { alignItems: 'center', gap: SPACING.sm }]}>
      {place(route.origin_city, route.origin_country)}
      <View style={{ alignItems: 'center', paddingHorizontal: 4 }}>
        <Ionicons name={route.mode === 'AIR' ? 'airplane' : 'car'} size={large ? 24 : 20} color={colors.accent} />
        <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={14} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1, alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: large ? FONT.xl : FONT.lg, textAlign: isRTL ? 'left' : 'right' }} numberOfLines={1}>{route.destination_city || '—'}</Text>
        {!!route.destination_country && <Text style={{ color: colors.textSecondary, fontSize: FONT.sm, textAlign: isRTL ? 'left' : 'right' }} numberOfLines={1}>{route.destination_country}</Text>}
      </View>
    </View>
  );
};
