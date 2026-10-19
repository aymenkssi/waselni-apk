import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { averageRating } from '../lib/format';
import { PublicUser } from '../lib/types';
import { useRow } from './ui';

/** "★ 4.8 (12)" or "New" without reviews. */
export const Rating: React.FC<{ user?: PublicUser | null }> = ({ user }) => {
  const { colors } = useTheme();
  const { tn, t } = useLanguage();
  const row = useRow();
  const avg = averageRating(user);
  // Some API answers (contracts) do not include the rating: show nothing rather than "New".
  if (user?.rating_count === undefined) return null;
  return (
    <View style={[row, { alignItems: 'center', gap: 3 }]}>
      <Ionicons name={avg == null ? 'star-outline' : 'star'} size={14} color={colors.star} />
      <Text style={{ color: colors.textSecondary, fontSize: FONT.sm }}>
        {avg == null ? t('no_reviews') : `${avg} · ${tn('reviews_count', user?.rating_count ?? 0)}`}
      </Text>
    </View>
  );
};

/** Five tappable stars to give a rating. */
export const StarInput: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const row = useRow();
  return (
    <View style={[row, { gap: 6, marginVertical: 6 }]}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} accessibilityRole="button" accessibilityLabel={String(n)}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={32} color={colors.star} />
        </TouchableOpacity>
      ))}
    </View>
  );
};
