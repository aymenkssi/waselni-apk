import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SPACING } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { fullName } from '../lib/format';
import { isProCarrier } from '../lib/roles';
import { PublicUser } from '../lib/types';
import { Avatar } from './Avatar';
import { Rating } from './Rating';
import { Body, Card, StatusPill, useRow } from './ui';

/** Author of an offer or request; opens the public profile. */
export const PersonCard: React.FC<{ user?: PublicUser | null; userId: string; label: string }> = ({ user, userId, label }) => {
  const { t } = useLanguage();
  const row = useRow();
  return (
    <Card onPress={() => router.push({ pathname: '/user/[id]', params: { id: userId } })}>
      <Body small secondary>{label}</Body>
      <View style={[row, { alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm }]}>
        <Avatar user={user} size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <Body bold>{fullName(user)}</Body>
          {!!(user?.city || user?.country) && <Body small secondary>{[user?.city, user?.country].filter(Boolean).join(', ')}</Body>}
          <Rating user={user} />
        </View>
        {isProCarrier(user) && <StatusPill label={t('pro_badge')} tone="success" />}
      </View>
    </Card>
  );
};
