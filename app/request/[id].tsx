import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OfferCard } from '../../components/Cards';
import { PersonCard } from '../../components/PersonCard';
import { ProposalSheet } from '../../components/ProposalSheet';
import { ReportSheet } from '../../components/ReportSheet';
import { RouteLine } from '../../components/RouteLine';
import { Screen } from '../../components/Screen';
import { HeaderIcon } from '../../components/ScreenHeader';
import { Body, Button, Card, Divider, ErrorState, InfoRow, Loading, SectionTitle, StatusPill } from '../../components/ui';
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useContact } from '../../hooks/useContact';
import { useLabels } from '../../hooks/useLabels';
import { apiErrorText, useQuery } from '../../hooks/useQuery';
import { SITE_URL } from '../../lib/config';
import { fileUrl } from '../../lib/files';
import { isCarrier } from '../../lib/roles';
import { Offer, ShipRequest } from '../../lib/types';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { api, user } = useAuth();
  const { date, mode, requestStatus, packageType } = useLabels();
  const { contact, busy } = useContact();
  const [reporting, setReporting] = useState(false);
  const [proposing, setProposing] = useState(false);
  const load = useCallback(() => api.get<ShipRequest>(`/requests/${id}`), [api, id]);
  const { data: req, error, loading, reload, refresh, refreshing } = useQuery(load);
  const mine = !!user && req?.user_id === user.id;
  const loadMatches = useCallback(() => api.get<{ items: Offer[] }>(`/matching/requests/${id}/offers`, { limit: 10 }), [api, id]);
  const matches = useQuery(mine ? loadMatches : null);
  const open = req?.status === 'OPEN' || req?.status === 'IN_NEGOTIATION';

  const cancel = () => Alert.alert(t('cancel_request'), t('cancel_request_confirm'), [
    { text: t('no'), style: 'cancel' },
    { text: t('yes'), style: 'destructive', onPress: async () => {
      try {
        await api.patch(`/requests/${id}`, { status: 'CANCELLED' });
        reload();
      } catch (e) {
        Alert.alert(t('error_title'), apiErrorText(e, t));
      }
    } },
  ]);

  const dims = req && [req.length, req.width, req.height].every((v) => v) ? `${req.length} × ${req.width} × ${req.height} cm` : null;
  const right = user && req && !mine ? <HeaderIcon icon="flag-outline" label={t('report')} onPress={() => setReporting(true)} /> : undefined;
  return (
    <Screen title={t('request_title')} back right={right} onRefresh={refresh} refreshing={refreshing}>
      {loading ? <Loading /> : error || !req ? <ErrorState message={error ?? ''} onRetry={reload} /> : (
        <>
          <Card>
            <RouteLine route={req} large />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md }}>
              <StatusPill label={mode(req.mode)} tone="info" />
              <StatusPill {...requestStatus(req.status)} />
            </View>
            <Divider />
            <InfoRow label={t('package_type')} value={packageType(req.package_type)} />
            <InfoRow label={t('weight')} value={t('kg_value', { a: req.weight })} />
            {!!dims && <InfoRow label={t('dimensions')} value={dims} />}
            <InfoRow label={t('deadline')} value={date(req.deadline)} />
            <Divider />
            <Body small secondary>{t('description')}</Body>
            <Body>{req.description}</Body>
            {!!req.photos?.length && (
              <ScrollView horizontal style={{ marginTop: SPACING.sm }} contentContainerStyle={{ gap: SPACING.sm }}>
                {req.photos.map((p) => (
                  <Image key={p} source={{ uri: fileUrl(SITE_URL, p)! }} style={{ width: 120, height: 120, borderRadius: BORDER_RADIUS.md }} />
                ))}
              </ScrollView>
            )}
          </Card>
          <PersonCard user={req.user} userId={req.user_id} label={t('sender')} />
          {mine ? (
            <>
              <Button variant="outline" icon="document-text-outline" label={t('my_contracts')} onPress={() => router.push('/contracts')} />
              {open && <Button variant="text" icon="close-circle-outline" label={t('cancel_request')} onPress={cancel} />}
              <SectionTitle title={t('matching_offers')} />
              {matches.data?.items.length ? matches.data.items.map((o) => <OfferCard key={o.id} offer={o} />)
                : <Body small secondary>{t('no_matching_offers')}</Body>}
            </>
          ) : (
            <>
              <Button icon="chatbubbles-outline" label={t('contact_sender')} loading={busy} onPress={() => contact(req.user_id, { request_id: req.id })} testID="contact" />
              {open && (!user || isCarrier(user)) && (
                <Button variant="outline" icon="pricetag-outline" label={t('make_proposal')} onPress={() => (user ? setProposing(true) : router.push('/login'))} testID="propose" />
              )}
            </>
          )}
          {user && <ReportSheet visible={reporting} onClose={() => setReporting(false)} targetType="REQUEST" targetId={req.id} />}
          {user && <ProposalSheet visible={proposing} onClose={() => setProposing(false)} request={req} />}
        </>
      )}
    </Screen>
  );
}
