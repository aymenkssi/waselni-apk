import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { RequestCard } from '../../components/Cards';
import { Fab } from '../../components/Fab';
import { FilterBar, Filters, matchesFilters, NO_FILTERS } from '../../components/FilterBar';
import { ListFooter } from '../../components/ListFooter';
import { Screen } from '../../components/Screen';
import { EmptyState, ErrorState, Loading } from '../../components/ui';
import { SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePagedList } from '../../hooks/usePagedList';
import { isShipper } from '../../lib/roles';
import { Paginated, ShipRequest } from '../../lib/types';

/** Shipping requests posted by senders (public). */
export default function Requests() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { api, user } = useAuth();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const load = useCallback((page: number) => api.get<Paginated<ShipRequest>>('/requests', { ...filters, page, limit: 20 }), [api, filters]);
  const list = usePagedList(load);
  const items = list.items.filter((r) => matchesFilters(r, filters));
  const canCreate = !user || isShipper(user);

  return (
    <Screen title={t('tab_requests')} scroll={false}
      fab={canCreate ? <Fab label={t('send_parcel')} onPress={() => router.push(user ? '/request/new' : '/login')} testID="new-request" /> : undefined}>
      <FilterBar value={filters} onChange={setFilters} />
      {list.loading ? <Loading /> : list.error && !items.length ? <ErrorState message={list.error} onRetry={list.refresh} /> : (
        <FlatList data={items} keyExtractor={(r) => r.id} renderItem={({ item }) => <RequestCard request={item} />}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 96 }}
          onEndReached={list.loadMore} onEndReachedThreshold={0.4} ListFooterComponent={<ListFooter loading={list.loadingMore} />}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="cube-outline" title={t('no_requests')} message={t('no_requests_msg')} />} />
      )}
    </Screen>
  );
}
