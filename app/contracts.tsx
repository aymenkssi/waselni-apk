import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { LoginRequired } from '../components/LoginRequired';
import { RouteLine } from '../components/RouteLine';
import { Screen } from '../components/Screen';
import { Body, Card, Chip, EmptyState, ErrorState, HScroll, Loading, StatusPill, useRow } from '../components/ui';
import { SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLabels } from '../hooks/useLabels';
import { useQuery } from '../hooks/useQuery';
import { fullName } from '../lib/format';
import { Contract, ContractStatus } from '../lib/types';

const FILTERS: (ContractStatus | 'ALL')[] = ['ALL', 'PROPOSED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];

/** Agreements between a sender and a carrier, from the proposal to the delivery. */
export default function Contracts() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { api, user } = useAuth();
  const { contractStatus, price } = useLabels();
  const row = useRow();
  const [filter, setFilter] = useState<ContractStatus | 'ALL'>('ALL');
  const load = useCallback(() => api.get<Contract[]>('/contracts'), [api]);
  const { data, error, loading, refresh, refreshing } = useQuery(user ? load : null);

  if (!user) return <Screen title={t('my_contracts')} back><LoginRequired /></Screen>;
  const items = (data ?? []).filter((c) => filter === 'ALL' || c.status === filter);
  return (
    <Screen title={t('my_contracts')} back scroll={false}>
      <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
        <HScroll>
          {FILTERS.map((f) => <Chip key={f} label={f === 'ALL' ? t('all') : contractStatus(f).label} selected={filter === f} onPress={() => setFilter(f)} />)}
        </HScroll>
      </View>
      {loading ? <Loading /> : error && !data ? <ErrorState message={error} onRetry={refresh} /> : (
        <FlatList data={items} keyExtractor={(c) => c.id} contentContainerStyle={{ padding: SPACING.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title={t('no_contracts')} message={t('no_contracts_msg')} />}
          renderItem={({ item }) => {
            const asShipper = item.shipper_id === user.id;
            const status = contractStatus(item.status);
            return (
              <Card onPress={() => router.push({ pathname: '/contract/[id]', params: { id: item.id } })} testID={`contract-${item.id}`}>
                {item.request && <RouteLine route={item.request} />}
                <View style={[row, { alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm }]}>
                  <View style={{ flex: 1 }}>
                    <Body small secondary>{t(asShipper ? 'with_carrier' : 'with_sender', { a: fullName(asShipper ? item.carrier : item.shipper) })}</Body>
                    <Body bold>{price(item.proposed_price)}</Body>
                  </View>
                  <StatusPill label={status.label} tone={status.tone} />
                </View>
              </Card>
            );
          }} />
      )}
    </Screen>
  );
}
