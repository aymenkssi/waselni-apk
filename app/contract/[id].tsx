import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { PersonCard } from '../../components/PersonCard';
import { StarInput } from '../../components/Rating';
import { RouteLine } from '../../components/RouteLine';
import { Screen } from '../../components/Screen';
import { Banner, Body, Button, Card, Divider, ErrorState, Field, InfoRow, Loading, SectionTitle, StatusPill, useRow } from '../../components/ui';
import { SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLabels } from '../../hooks/useLabels';
import { apiErrorText, useQuery } from '../../hooks/useQuery';
import { SITE_URL } from '../../lib/config';
import { Contract, ContractStatus } from '../../lib/types';

const STEPS: ContractStatus[] = ['PROPOSED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED'];

/** Contract tracking: accept (sender), pick-up (carrier), delivery (sender), review, payment on the website. */
export default function ContractDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { api, user } = useAuth();
  const { contractStatus, price, dateTime, packageType } = useLabels();
  const row = useRow();
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const load = useCallback(async () => {
    const contract = await api.get<Contract>(`/contracts/${id}`);
    const payment = await api.get<{ status?: string } | null>(`/payments/contract/${id}`).catch(() => null);
    return { contract, payment };
  }, [api, id]);
  const { data, error, loading, reload, refresh, refreshing } = useQuery(user ? load : null);

  if (loading) return <Screen title={t('contract')} back><Loading /></Screen>;
  if (error || !data || !user) return <Screen title={t('contract')} back><ErrorState message={error ?? ''} onRetry={reload} /></Screen>;
  const c = data.contract;
  const asShipper = c.shipper_id === user.id;
  const asCarrier = c.carrier_id === user.id;
  const reviewed = (c.reviews ?? []).some((r) => r.reviewer_id === user.id);
  const paid = data.payment?.status === 'COMPLETED' || data.payment?.status === 'completed';
  const stepIndex = STEPS.indexOf(c.status);

  const act = (path: string, confirmKey: string) => Alert.alert(t(confirmKey), t('confirm_action'), [
    { text: t('no'), style: 'cancel' },
    { text: t('yes'), onPress: async () => {
      setBusy(true);
      try {
        await api.post(`/contracts/${id}/${path}`);
        reload();
      } catch (e) {
        Alert.alert(t('error_title'), apiErrorText(e, t));
      } finally {
        setBusy(false);
      }
    } },
  ]);

  const sendReview = async () => {
    if (!comment.trim()) { Alert.alert(t('error_title'), t('review_comment_needed')); return; }
    setBusy(true);
    try {
      await api.post(`/contracts/${id}/reviews`, { rating, comment: comment.trim() });
      setComment('');
      reload();
    } catch (e) {
      Alert.alert(t('error_title'), apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  const status = contractStatus(c.status);
  return (
    <Screen title={t('contract')} back onRefresh={refresh} refreshing={refreshing}>
      <Card>
        {c.request && <RouteLine route={c.request} large />}
        <View style={[row, { marginTop: SPACING.md, gap: SPACING.sm, alignItems: 'center' }]}>
          <View style={{ flex: 1 }}><Body bold>{price(c.proposed_price)}</Body></View>
          <StatusPill label={status.label} tone={status.tone} />
        </View>
        {c.request && (
          <>
            <Divider />
            <InfoRow label={t('package_type')} value={packageType(c.request.package_type)} />
            <InfoRow label={t('weight')} value={t('kg_value', { a: c.request.weight })} />
          </>
        )}
        <Button variant="text" icon="cube-outline" label={t('see_request')} onPress={() => router.push({ pathname: '/request/[id]', params: { id: c.request_id } })} />
      </Card>

      {c.status !== 'CANCELLED' && (
        <>
          <SectionTitle title={t('tracking')} />
          <Card>
            {STEPS.map((s, i) => {
              const event = c.timeline.find((e) => e.status === s);
              const done = i <= stepIndex;
              return (
                <View key={s} style={[row, { gap: SPACING.md, alignItems: 'center', paddingVertical: 6 }]}>
                  <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? colors.success : colors.divider} />
                  <View style={{ flex: 1 }}>
                    <Body bold={done}>{t(`step_${s}`)}</Body>
                    {!!event && <Body small secondary>{dateTime(event.timestamp)}</Body>}
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}

      <PersonCard user={asShipper ? c.carrier : c.shipper} userId={asShipper ? c.carrier_id : c.shipper_id} label={t(asShipper ? 'carrier' : 'sender')} />
      {(c.status === 'ACCEPTED' || c.status === 'PICKED_UP') && !!(asShipper ? c.carrier?.phone : c.shipper?.phone) && (
        <InfoRow label={t('phone')} value={(asShipper ? c.carrier?.phone : c.shipper?.phone) ?? ''} />
      )}

      {asShipper && c.status === 'PROPOSED' && <Button icon="checkmark-circle-outline" label={t('accept_proposal')} loading={busy} onPress={() => act('accept', 'accept_proposal')} testID="accept" />}
      {asCarrier && c.status === 'PROPOSED' && <Banner text={t('waiting_sender')} />}
      {asCarrier && c.status === 'ACCEPTED' && <Button icon="cube-outline" label={t('confirm_pickup')} loading={busy} onPress={() => act('pickup', 'confirm_pickup')} testID="pickup" />}
      {asShipper && c.status === 'PICKED_UP' && <Button icon="flag-outline" label={t('confirm_delivery')} loading={busy} onPress={() => act('deliver', 'confirm_delivery')} testID="deliver" />}
      {asShipper && ['ACCEPTED', 'PICKED_UP', 'DELIVERED'].includes(c.status) && (
        paid ? <Banner tone="success" text={t('payment_done')} /> : (
          <Card>
            <Body>{t('payment_web')}</Body>
            <Button variant="outline" icon="card-outline" label={t('pay_on_site')} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/contracts/${c.id}`)} />
          </Card>
        )
      )}
      {c.status !== 'DELIVERED' && c.status !== 'CANCELLED' && (
        <Button variant="text" icon="close-circle-outline" label={t('cancel_contract')} color={colors.error} onPress={() => act('cancel', 'cancel_contract')} />
      )}

      {c.status === 'DELIVERED' && (
        <>
          <SectionTitle title={t('reviews')} />
          {(c.reviews ?? []).map((r) => (
            <Card key={r.id}>
              <Body small secondary>{t(r.reviewer_id === user.id ? 'your_review' : 'their_review')}</Body>
              <Body bold>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Body>
              <Body>{r.comment}</Body>
            </Card>
          ))}
          {!reviewed && (
            <Card>
              <Body bold>{t('leave_review')}</Body>
              <StarInput value={rating} onChange={setRating} />
              <Field label={t('review_comment')} value={comment} onChangeText={setComment} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
              <Button icon="send" label={t('send')} loading={busy} onPress={sendReview} />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
