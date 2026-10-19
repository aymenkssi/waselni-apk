import React, { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { OfferCard, RequestCard } from '../components/Cards';
import { LoginRequired } from '../components/LoginRequired';
import { Screen } from '../components/Screen';
import { Button, EmptyState, ErrorState, Loading, Segmented } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from '../hooks/useQuery';
import { isCarrier, isShipper } from '../lib/roles';
import { Offer, Paginated, ShipRequest } from '../lib/types';

/** The user's own trips and shipping requests. */
export default function MyAds() {
  const { t } = useLanguage();
  const { api, user } = useAuth();
  const [tab, setTab] = useState<'requests' | 'offers'>(user && !isShipper(user) ? 'offers' : 'requests');
  const load = useCallback(async () => {
    const [requests, offers] = await Promise.all([
      isShipper(user) ? api.get<Paginated<ShipRequest>>('/requests/mine', { limit: 100 }) : Promise.resolve({ items: [] as ShipRequest[] }),
      isCarrier(user) ? api.get<Paginated<Offer>>('/offers/mine', { limit: 100 }) : Promise.resolve({ items: [] as Offer[] }),
    ]);
    return { requests: requests.items, offers: offers.items };
  }, [api, user]);
  const { data, error, loading, refresh, refreshing } = useQuery(user ? load : null);

  if (!user) return <Screen title={t('my_ads')} back><LoginRequired /></Screen>;
  const both = isShipper(user) && isCarrier(user);
  return (
    <Screen title={t('my_ads')} back onRefresh={refresh} refreshing={refreshing}>
      {both && <Segmented value={tab} onChange={setTab} options={[{ value: 'requests', label: t('my_requests'), icon: 'cube-outline' }, { value: 'offers', label: t('my_offers'), icon: 'airplane-outline' }]} />}
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={refresh} /> : tab === 'requests' ? (
        data?.requests.length ? data.requests.map((r) => <RequestCard key={r.id} request={r} />) : (
          <EmptyState icon="cube-outline" title={t('no_my_requests')} action={<Button label={t('send_parcel')} icon="add" onPress={() => router.push('/request/new')} />} />
        )
      ) : (
        data?.offers.length ? data.offers.map((o) => <OfferCard key={o.id} offer={o} showStatus />) : (
          <EmptyState icon="airplane-outline" title={t('no_my_offers')} action={<Button label={t('offer_trip')} icon="add" onPress={() => router.push('/offer/new')} />} />
        )
      )}
    </Screen>
  );
}
