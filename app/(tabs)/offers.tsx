import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { OfferCard } from '../../components/Cards';
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
import { isCarrier } from '../../lib/roles';
import { Offer, Paginated } from '../../lib/types';

/** Trips offered by carriers (public). */
export default function Offers() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { api, user } = useAuth();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const load = useCallback((page: number) => api.get<Paginated<Offer>>('/offers', { ...filters, page, limit: 20 }), [api, filters]);
  const list = usePagedList(load);
  const items = list.items.filter((o) => matchesFilters(o, filters));
  const canCreate = !user || isCarrier(user);

  return (
    <Screen title={t('tab_offers')} scroll={false}
      fab={canCreate ? <Fab label={t('offer_trip')} onPress={() => router.push(user ? '/offer/new' : '/login')} testID="new-offer" /> : undefined}>
      <FilterBar value={filters} onChange={setFilters} />
      {list.loading ? <Loading /> : list.error && !items.length ? <ErrorState message={list.error} onRetry={list.refresh} /> : (
        <FlatList data={items} keyExtractor={(o) => o.id} renderItem={({ item }) => <OfferCard offer={item} />}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 96 }}
          onEndReached={list.loadMore} onEndReachedThreshold={0.4} ListFooterComponent={<ListFooter loading={list.loadingMore} />}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="airplane-outline" title={t('no_offers')} message={t('no_offers_msg')} />} />
      )}
    </Screen>
  );
}
