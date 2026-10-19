import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { DateField } from '../../components/DateField';
import { LoginRequired } from '../../components/LoginRequired';
import { PlaceFields } from '../../components/PlaceFields';
import { Screen } from '../../components/Screen';
import { Banner, Button, Field, Loading, SectionTitle, Segmented } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCountries } from '../../hooks/usePlaces';
import { apiErrorText } from '../../hooks/useQuery';
import { useVerification } from '../../hooks/useVerification';
import { addDays, parseNumber, toIsoDate } from '../../lib/format';
import { Offer, ShippingMode } from '../../lib/types';
import { offerErrors, OfferForm } from '../../lib/validation';

/** A carrier publishes a trip (identity must be verified first). */
export default function NewOffer() {
  const { t } = useLanguage();
  const { api, user } = useAuth();
  const { origins, destinations } = useCountries();
  const verification = useVerification();
  const today = toIsoDate(new Date());
  const [mode, setMode] = useState<ShippingMode>('TERRESTRIAL');
  const [form, setForm] = useState<OfferForm>({
    origin_country: '', origin_city: '', destination_country: '', destination_city: '',
    departure_date: addDays(today, 7), arrival_date: addDays(today, 9), capacity_kg: '', price_per_kg: '',
  });
  const [conditions, setConditions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof OfferForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!user) return <Screen title={t('offer_trip')} back><LoginRequired /></Screen>;
  if (verification.required && !verification.data) return <Screen title={t('offer_trip')} back><Loading /></Screen>;
  if (verification.needsAction) {
    return (
      <Screen title={t('offer_trip')} back>
        <Banner tone="warning" text={t('offer_needs_verification')} />
        <Button label={t('verify_identity')} icon="shield-checkmark-outline" onPress={() => router.replace('/verification')} />
      </Screen>
    );
  }

  const submit = async () => {
    const e = offerErrors(form, today);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const offer = await api.post<Offer>('/offers', {
        origin_country: form.origin_country, origin_city: form.origin_city.trim(),
        destination_country: form.destination_country, destination_city: form.destination_city.trim(),
        departure_date: `${form.departure_date}T00:00:00`, arrival_date: `${form.arrival_date}T00:00:00`,
        capacity_kg: parseNumber(form.capacity_kg), price_per_kg: parseNumber(form.price_per_kg), mode, conditions: conditions.trim() || null,
      });
      router.replace({ pathname: '/offer/[id]', params: { id: offer.id } });
    } catch (err) {
      Alert.alert(t('error_title'), apiErrorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('offer_trip')} back>
      <Segmented label={t('transport_mode')} value={mode} onChange={setMode} options={[
        { value: 'TERRESTRIAL', label: t('mode_road'), icon: 'car-outline' },
        { value: 'AIR', label: t('mode_air'), icon: 'airplane-outline' },
      ]} />
      <SectionTitle title={t('departure')} />
      <PlaceFields countryLabel={t('country')} cityLabel={t('city')} countries={origins} country={form.origin_country} city={form.origin_city}
        onCountry={set('origin_country')} onCity={set('origin_city')} countryError={errors.origin_country} cityError={errors.origin_city} testID="origin" />
      <DateField label={t('departure_date')} value={form.departure_date} minimumDate={today} error={errors.departure_date}
        onChange={(d) => setForm((f) => ({ ...f, departure_date: d, arrival_date: f.arrival_date < d ? d : f.arrival_date }))} />
      <SectionTitle title={t('arrival')} />
      <PlaceFields countryLabel={t('country')} cityLabel={t('city')} countries={destinations} country={form.destination_country} city={form.destination_city}
        onCountry={set('destination_country')} onCity={set('destination_city')} countryError={errors.destination_country} cityError={errors.destination_city} testID="destination" />
      <DateField label={t('arrival_date')} value={form.arrival_date} minimumDate={form.departure_date} error={errors.arrival_date} onChange={set('arrival_date')} />
      <SectionTitle title={t('capacity_price')} />
      <Field label={t('capacity_kg')} value={form.capacity_kg} onChangeText={set('capacity_kg')} keyboardType="decimal-pad" error={errors.capacity_kg} testID="capacity" />
      <Field label={t('price_per_kg_eur')} value={form.price_per_kg} onChangeText={set('price_per_kg')} keyboardType="decimal-pad" error={errors.price_per_kg} testID="price" />
      <Field label={t('conditions_optional')} value={conditions} onChangeText={setConditions} multiline numberOfLines={3} placeholder={t('conditions_placeholder')}
        style={{ minHeight: 80, textAlignVertical: 'top' }} />
      {Object.keys(errors).length > 0 && <Banner tone="error" text={t('err_form')} />}
      <Button label={t('publish')} icon="checkmark" onPress={submit} loading={busy} testID="publish" />
    </Screen>
  );
}
