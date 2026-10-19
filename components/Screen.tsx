import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from './ScreenHeader';

/** Standard page: header and scrollable content, with pull-to-refresh when `onRefresh` is given. */
export const Screen: React.FC<{
  title: string; back?: boolean; right?: ReactNode; children: ReactNode; scroll?: boolean; fab?: ReactNode; testID?: string;
  onRefresh?: () => void; refreshing?: boolean; footer?: ReactNode;
}> = ({ title, back, right, children, scroll = true, fab, testID, onRefresh, refreshing = false, footer }) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={back ? ['top', 'bottom'] : ['top']} style={{ flex: 1, backgroundColor: colors.background }} testID={testID}>
      <ScreenHeader title={title} back={back} right={right} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1 }}>
          {scroll ? (
            <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: fab ? 96 : SPACING.xl }} keyboardShouldPersistTaps="handled"
              refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}>
              {children}
            </ScrollView>
          ) : children}
          {fab}
        </View>
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
