import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

/** Floating "create" button at the bottom of a list. */
export const Fab: React.FC<{ label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; testID?: string }> = ({ label, icon = 'add', onPress, testID }) => {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();
  return (
    <TouchableOpacity onPress={onPress} testID={testID} accessibilityRole="button" activeOpacity={0.85}
      style={{
        position: 'absolute', bottom: SPACING.lg, [isRTL ? 'left' : 'right']: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.accent, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14, elevation: 4,
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
      }}>
      <Ionicons name={icon} size={22} color={colors.onAccent} />
      <Text style={{ color: colors.onAccent, fontWeight: '700', fontSize: FONT.md }}>{label}</Text>
    </TouchableOpacity>
  );
};
