import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SPACING } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useLabels } from '../hooks/useLabels';
import { fullName } from '../lib/format';
import { isProCarrier } from '../lib/roles';
import { Offer, ShipRequest } from '../lib/types';
import { Avatar } from './Avatar';
import { Rating } from './Rating';
import { RouteLine } from './RouteLine';
import { Body, Card, Divider, StatusPill, useRow } from './ui';

/** Trip offered by a carrier, as shown in lists. */
export const OfferCard: React.FC<{ offer: Offer; showStatus?: boolean }> = ({ offer, showStatus }) => {
  const { t } = useLanguage();
  const { date, price, mode, offerStatus } = useLabels();
  const row = useRow();
  const status = offerStatus(offer.status);
  return (
    <Card onPress={() => router.push({ pathname: '/offer/[id]', params: { id: offer.id } })} testID={`offer-${offer.id}`}>
      <RouteLine route={offer} />
      <View style={[row, { flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm }]}>
        <StatusPill label={mode(offer.mode)} tone="info" />
        <StatusPill label={t('departure_on', { a: date(offer.departure_date) })} />
        <StatusPill label={t('kg_available', { a: offer.capacity_kg })} />
        <StatusPill label={t('price_per_kg_short', { a: price(offer.price_per_kg) })} tone="accent" />
        {showStatus && <StatusPill label={status.label} tone={status.tone} />}
      </View>
      {!!offer.user && (
        <>
          <Divider />
          <View style={[row, { alignItems: 'center', gap: SPACING.sm }]}>
            <Avatar user={offer.user} size={32} />
            <View style={{ flex: 1 }}>
              <Body small bold>{fullName(offer.user)}</Body>
              <Rating user={offer.user} />
            </View>
            {isProCarrier(offer.user) && <StatusPill label={t('pro_badge')} tone="success" />}
          </View>
        </>
      )}
    </Card>
  );
};

/** Shipping request posted by a sender, as shown in lists. */
export const RequestCard: React.FC<{ request: ShipRequest; showStatus?: boolean }> = ({ request, showStatus = true }) => {
  const { t } = useLanguage();
  const { date, mode, requestStatus, packageType } = useLabels();
  const row = useRow();
  const status = requestStatus(request.status);
  return (
    <Card onPress={() => router.push({ pathname: '/request/[id]', params: { id: request.id } })} testID={`request-${request.id}`}>
      <RouteLine route={request} />
      <View style={[row, { flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm }]}>
        <StatusPill label={mode(request.mode)} tone="info" />
        <StatusPill label={packageType(request.package_type)} />
        <StatusPill label={t('weight_kg', { a: request.weight })} />
        <StatusPill label={t('before_date', { a: date(request.deadline) })} />
        {showStatus && <StatusPill label={status.label} tone={status.tone} />}
      </View>
      {!!request.description && <View style={{ marginTop: SPACING.sm }}><Body small secondary numberOfLines={2}>{request.description}</Body></View>}
      {!!request.user && (
        <>
          <Divider />
          <View style={[row, { alignItems: 'center', gap: SPACING.sm }]}>
            <Avatar user={request.user} size={32} />
            <View style={{ flex: 1 }}>
              <Body small bold>{fullName(request.user)}</Body>
              <Rating user={request.user} />
            </View>
          </View>
        </>
      )}
    </Card>
  );
};
