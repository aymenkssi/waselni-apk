import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { Rating } from '../../components/Rating';
import { ReportSheet } from '../../components/ReportSheet';
import { Screen } from '../../components/Screen';
import { HeaderIcon } from '../../components/ScreenHeader';
import { Body, Card, ErrorState, Loading, SectionTitle, StatusPill, Title } from '../../components/ui';
import { SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLabels } from '../../hooks/useLabels';
import { useQuery } from '../../hooks/useQuery';
import { fullName } from '../../lib/format';
import { isProCarrier, roleKey } from '../../lib/roles';
import { PublicUser, Review } from '../../lib/types';

/** Public profile: identity, rating and reviews left after real deliveries. */
export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { api, user: me } = useAuth();
  const { date } = useLabels();
  const [reporting, setReporting] = useState(false);
  const load = useCallback(async () => {
    const [user, reviews] = await Promise.all([api.get<PublicUser>(`/users/${id}`), api.get<Review[]>(`/users/${id}/reviews`)]);
    return { user, reviews };
  }, [api, id]);
  const { data, error, loading, reload } = useQuery(load);
  const right = me && me.id !== id ? <HeaderIcon icon="flag-outline" label={t('report')} onPress={() => setReporting(true)} /> : undefined;

  return (
    <Screen title={t('profile')} back right={right}>
      {loading ? <Loading /> : error || !data ? <ErrorState message={error ?? ''} onRetry={reload} /> : (
        <>
          <View style={{ alignItems: 'center', gap: SPACING.sm, marginVertical: SPACING.md }}>
            <Avatar user={data.user} size={96} />
            <Title>{fullName(data.user)}</Title>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <StatusPill label={t(roleKey(data.user))} tone="info" />
              {isProCarrier(data.user) && <StatusPill label={t('pro_badge')} tone="success" />}
            </View>
            {!!(data.user.city || data.user.country) && <Body secondary>{[data.user.city, data.user.country].filter(Boolean).join(', ')}</Body>}
            <Rating user={data.user} />
            {!!data.user.created_at && <Body small secondary>{t('member_since', { a: date(data.user.created_at) })}</Body>}
          </View>
          {!!data.user.bio && <Card><Body>{data.user.bio}</Body></Card>}
          <SectionTitle title={t('reviews')} />
          {data.reviews.length ? data.reviews.map((r) => (
            <Card key={r.id}>
              <Body bold>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Body>
              <Body>{r.comment}</Body>
              <Body small secondary>{date(r.created_at)}</Body>
            </Card>
          )) : <Body secondary small>{t('no_reviews_yet')}</Body>}
          {me && <ReportSheet visible={reporting} onClose={() => setReporting(false)} targetType="USER" targetId={id} />}
        </>
      )}
    </Screen>
  );
}
