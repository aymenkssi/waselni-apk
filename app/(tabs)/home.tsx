import React, { useCallback } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { OfferCard, RequestCard } from '../../components/Cards';
import { Screen } from '../../components/Screen';
import { Banner, Body, Button, Card, SectionTitle, useRow } from '../../components/ui';
import { BORDER_RADIUS, FONT, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuery } from '../../hooks/useQuery';
import { useVerification } from '../../hooks/useVerification';
import { isCarrier, isShipper } from '../../lib/roles';
import { Offer, Paginated, ShipRequest } from '../../lib/types';

interface HomeData { offers: Offer[]; requests: ShipRequest[]; stats: { value: string; label: string }[] }

export default function Home() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { api, user } = useAuth();
  const row = useRow();
  const verification = useVerification();

  const load = useCallback(async (): Promise<HomeData> => {
    const [offers, requests, stats] = await Promise.all([
      api.get<Paginated<Offer>>('/offers', { limit: 3 }),
      api.get<Paginated<ShipRequest>>('/requests', { limit: 3 }),
      api.get<{ stats_enabled: boolean; stats: { value: string; label: string }[] }>('/home-stats').catch(() => ({ stats_enabled: false, stats: [] })),
    ]);
    return { offers: offers.items, requests: requests.items, stats: stats.stats_enabled ? stats.stats : [] };
  }, [api]);
  const { data, refreshing, refresh } = useQuery(load);

  const action = (icon: keyof typeof Ionicons.glyphMap, title: string, subtitle: string, onPress: () => void, testID: string, accent?: boolean) => (
    <TouchableOpacity onPress={onPress} testID={testID} accessibilityRole="button" activeOpacity={0.8}
      style={{ flex: 1, backgroundColor: accent ? colors.accent : colors.brand, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, gap: 6, minHeight: 120 }}>
      <Ionicons name={icon} size={28} color={colors.textLight} />
      <Text style={{ color: colors.textLight, fontSize: FONT.lg, fontWeight: '800' }}>{title}</Text>
      <Text style={{ color: colors.textLight, fontSize: FONT.sm, opacity: 0.9 }}>{subtitle}</Text>
    </TouchableOpacity>
  );
  const go = (path: '/request/new' | '/offer/new') => router.push(user ? path : '/login');

  return (
    <Screen title="Waselni" onRefresh={refresh} refreshing={refreshing} testID="home-screen">
      <View style={{ alignItems: 'center', marginBottom: SPACING.sm }}>
        <Image source={require('../../assets/images/logo.png')} style={{ width: 200, height: 100 }} resizeMode="contain" />
        <Body secondary>{user ? t('hello', { a: user.first_name ?? '' }) : t('tagline')}</Body>
      </View>

      {verification.needsAction && (
        <Banner tone={verification.status === 'REJECTED' ? 'error' : 'warning'} text={t(`verif_banner_${verification.status}`)}
          action={<Button variant="outline" label={t('verify_identity')} icon="shield-checkmark-outline" onPress={() => router.push('/verification')} />} />
      )}

      <View style={[row, { gap: SPACING.sm, marginTop: SPACING.sm }]}>
        {(!user || isShipper(user)) && action('cube', t('send_parcel'), t('send_parcel_desc'), () => go('/request/new'), 'home-send', true)}
        {(!user || isCarrier(user)) && action('airplane', t('offer_trip'), t('offer_trip_desc'), () => go('/offer/new'), 'home-trip')}
      </View>
      <View style={[row, { gap: SPACING.sm, marginTop: SPACING.sm }]}>
        <View style={{ flex: 1 }}><Button variant="outline" icon="search" label={t('find_carrier')} onPress={() => router.push('/(tabs)/offers')} /></View>
        <View style={{ flex: 1 }}><Button variant="outline" icon="list" label={t('see_requests')} onPress={() => router.push('/(tabs)/requests')} /></View>
      </View>

      {!!data?.stats.length && (
        <View style={[row, { gap: SPACING.sm, marginTop: SPACING.md }]}>
          {data.stats.map((s, i) => (
            <Card key={i} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
              <Text style={{ color: colors.accent, fontWeight: '800', fontSize: FONT.lg }}>{s.value}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: FONT.xs, textAlign: 'center' }} numberOfLines={2}>{s.label}</Text>
            </Card>
          ))}
        </View>
      )}

      <SectionTitle title={t('latest_offers')} action={<Button variant="text" label={t('see_all')} onPress={() => router.push('/(tabs)/offers')} />} />
      {data?.offers.length ? data.offers.map((o) => <OfferCard key={o.id} offer={o} />) : <Body secondary small>{t('no_offers')}</Body>}

      <SectionTitle title={t('latest_requests')} action={<Button variant="text" label={t('see_all')} onPress={() => router.push('/(tabs)/requests')} />} />
      {data?.requests.length ? data.requests.map((r) => <RequestCard key={r.id} request={r} />) : <Body secondary small>{t('no_requests')}</Body>}

      <SectionTitle title={t('how_it_works')} />
      {(['how_1', 'how_2', 'how_3'] as const).map((k, i) => (
        <View key={k} style={[row, { gap: SPACING.md, alignItems: 'center', marginVertical: 6 }]}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentContainer, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.onAccentContainer, fontWeight: '800' }}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}><Body>{t(k)}</Body></View>
        </View>
      ))}

      <SectionTitle title={t('guarantees')} />
      <Card>
        {([['card-outline', 'guarantee_identity'], ['business-outline', 'guarantee_pro'], ['star-outline', 'guarantee_reviews'], ['lock-closed-outline', 'guarantee_security']] as const).map(([icon, k]) => (
          <View key={k} style={[row, { gap: SPACING.md, alignItems: 'center', paddingVertical: 6 }]}>
            <Ionicons name={icon} size={20} color={colors.primary} />
            <View style={{ flex: 1 }}><Body small>{t(k)}</Body></View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
