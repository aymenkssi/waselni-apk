import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { LoginRequired } from '../../components/LoginRequired';
import { Screen } from '../../components/Screen';
import { Body, Card, EmptyState, ErrorState, Loading, useRow } from '../../components/ui';
import { SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLabels } from '../../hooks/useLabels';
import { useQuery } from '../../hooks/useQuery';
import { fullName } from '../../lib/format';
import { Conversation } from '../../lib/types';

export default function Messages() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { api, user } = useAuth();
  const { dateTime } = useLabels();
  const row = useRow();
  const load = useCallback(() => api.get<Conversation[]>('/conversations'), [api]);
  const { data, error, loading, refresh, refreshing } = useQuery(user ? load : null);

  if (!user) return <Screen title={t('tab_messages')}><LoginRequired message={t('login_messages')} /></Screen>;
  return (
    <Screen title={t('tab_messages')} scroll={false}>
      {loading ? <Loading /> : error && !data ? <ErrorState message={error} onRetry={refresh} /> : (
        <FlatList data={data ?? []} keyExtractor={(c) => c.id} contentContainerStyle={{ padding: SPACING.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title={t('no_conversations')} message={t('no_conversations_msg')} />}
          renderItem={({ item }) => {
            const about = item.request ?? item.offer;
            return (
              <Card onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: item.id } })} testID={`conversation-${item.id}`}>
                <View style={[row, { gap: SPACING.md, alignItems: 'center' }]}>
                  <Avatar user={item.other_user} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Body bold numberOfLines={1}>{fullName(item.other_user)}</Body>
                    {!!about && <Body small secondary numberOfLines={1}>{`${about.origin_city ?? ''} → ${about.destination_city ?? ''}`}</Body>}
                    <Body small numberOfLines={1}>{item.last_message === '[Pièce jointe]' ? t('attachment') : item.last_message || t('no_message_yet')}</Body>
                  </View>
                  <Body small secondary>{dateTime(item.last_message_at).split(' · ')[0]}</Body>
                </View>
              </Card>
            );
          }} />
      )}
    </Screen>
  );
}
