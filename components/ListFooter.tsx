import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SPACING } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export const ListFooter: React.FC<{ loading: boolean }> = ({ loading }) => {
  const { colors } = useTheme();
  return <View style={{ padding: SPACING.lg }}>{loading && <ActivityIndicator color={colors.primary} />}</View>;
};
