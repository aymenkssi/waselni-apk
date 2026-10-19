import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { RequestCard } from '../../components/Cards';
import { PersonCard } from '../../components/PersonCard';
import { ReportSheet } from '../../components/ReportSheet';
import { RouteLine } from '../../components/RouteLine';
import { Screen } from '../../components/Screen';
import { HeaderIcon } from '../../components/ScreenHeader';
import { Body, Button, Card, Divider, ErrorState, InfoRow, Loading, SectionTitle, StatusPill } from '../../components/ui';
import { SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useContact } from '../../hooks/useContact';
import { useLabels } from '../../hooks/useLabels';
import { apiErrorText, useQuery } from '../../hooks/useQuery';
import { Offer, ShipRequest } from '../../lib/types';

export default function OfferDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { api, user } = useAuth();
  const { date, price, mode, offerStatus } = useLabels();
  const { contact, busy } = useContact();
  const [reporting, setReporting] = useState(false);
  const load = useCallback(() => api.get<Offer>(`/offers/${id}`), [api, id]);
  const { data: offer, error, loading, reload, refresh, refreshing } = useQuery(load);
  const mine = !!user && offer?.user_id === user.id;
  const loadMatches = useCallback(() => api.get<{ items: ShipRequest[] }>(`/matching/offers/${id}/requests`, { limit: 10 }), [api, id]);
  const matches = useQuery(mine ? loadMatches : null);

  const setStatus = async (status: 'ACTIVE' | 'PAUSED') => {
    try {
      await api.patch(`/offers/${id}`, { status });
      reload();
    } catch (e) {
      Alert.alert(t('error_title'), apiErrorText(e, t));
    }
  };
  const remove = () => Alert.alert(t('delete_offer'), t('delete_confirm'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('delete'), style: 'destructive', onPress: async () => {
      try {
        await api.del(`/offers/${id}`);
        router.back();
      } catch (e) {
        Alert.alert(t('error_title'), apiErrorText(e, t));
      }
    } },
  ]);

  const right = user && offer && !mine ? <HeaderIcon icon="flag-outline" label={t('report')} onPress={() => setReporting(true)} /> : undefined;
  return (
    <Screen title={t('offer_title')} back right={right} onRefresh={refresh} refreshing={refreshing}>
      {loading ? <Loading /> : error || !offer ? <ErrorState message={error ?? ''} onRetry={reload} /> : (
        <>
          <Card>
            <RouteLine route={offer} large />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md }}>
              <StatusPill label={mode(offer.mode)} tone="info" />
              <StatusPill {...offerStatus(offer.status)} />
            </View>
            <Divider />
            <InfoRow label={t('departure_date')} value={date(offer.departure_date)} />
            <InfoRow label={t('arrival_date')} value={date(offer.arrival_date)} />
            <InfoRow label={t('capacity')} value={t('kg_value', { a: offer.capacity_kg })} />
            <InfoRow label={t('price_per_kg')} value={price(offer.price_per_kg)} />
            {!!offer.conditions && (<><Divider /><Body small secondary>{t('conditions')}</Body><Body>{offer.conditions}</Body></>)}
          </Card>
          <PersonCard user={offer.user} userId={offer.user_id} label={t('carrier')} />
          {mine ? (
            <>
              {offer.status === 'ACTIVE'
                ? <Button variant="outline" icon="pause" label={t('pause_offer')} onPress={() => setStatus('PAUSED')} />
                : <Button variant="outline" icon="play" label={t('activate_offer')} onPress={() => setStatus('ACTIVE')} />}
              <Button variant="text" icon="trash-outline" label={t('delete_offer')} onPress={remove} />
              <SectionTitle title={t('matching_requests')} />
              {matches.data?.items.length ? matches.data.items.map((r) => <RequestCard key={r.id} request={r} />)
                : <Body small secondary>{t('no_matching_requests')}</Body>}
            </>
          ) : (
            <Button icon="chatbubbles-outline" label={t('contact_carrier')} loading={busy}
              onPress={() => contact(offer.user_id, { offer_id: offer.id })} testID="contact" />
          )}
          {user && <ReportSheet visible={reporting} onClose={() => setReporting(false)} targetType="OFFER" targetId={offer.id} />}
        </>
      )}
    </Screen>
  );
}
