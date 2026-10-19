import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { PlaceFields } from '../components/PlaceFields';
import { Screen } from '../components/Screen';
import { Banner, Body, Button, Card, CheckRow, Field, SectionTitle, Segmented, useRow } from '../components/ui';
import { FONT, SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCountries } from '../hooks/usePlaces';
import { apiErrorText } from '../hooks/useQuery';
import { LEGAL_PAGES } from '../lib/config';
import { fullPhone, localDigits } from '../lib/phone';
import { Role } from '../lib/types';
import { RegisterForm, registerErrors } from '../lib/validation';

type Profile = 'shipper' | 'carrier' | 'both';

const ROLE: Record<Profile, Record<'individual' | 'pro', Role>> = {
  shipper: { individual: 'SHIPPER', pro: 'SHIPPER' },
  carrier: { individual: 'CARRIER_INDIVIDUAL', pro: 'CARRIER_PRO' },
  both: { individual: 'SHIPPER_CARRIER', pro: 'SHIPPER_CARRIER' },
};

/** Account creation, same fields and rules as the website. */
export default function Register() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { register, api } = useAuth();
  const { all } = useCountries();
  const row = useRow();
  const [profile, setProfile] = useState<Profile>('shipper');
  const [carrierType, setCarrierType] = useState<'individual' | 'pro'>('individual');
  const [form, setForm] = useState<RegisterForm>({ email: '', password: '', confirm: '', first_name: '', last_name: '', phone: '', country: '', city: '', accepted: false });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dial, setDial] = useState('');
  const [dialLoading, setDialLoading] = useState(false);
  const lastCountry = useRef('');
  const set = <K extends keyof RegisterForm>(k: K) => (v: RegisterForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  // International dialling code of the chosen country: always replaced when the country changes.
  const chooseCountry = (country: string) => {
    lastCountry.current = country;
    setForm((f) => ({ ...f, country }));
    setDial('');
    setDialLoading(true);
    api.get<{ phone_code: string }>(`/country-phone-code/${encodeURIComponent(country)}`)
      // Ignore a late answer for a country the user has already changed.
      .then((r) => { if (lastCountry.current === country) setDial(r.phone_code || ''); })
      .catch(() => undefined)
      .finally(() => { if (lastCountry.current === country) setDialLoading(false); });
  };

  const submit = async () => {
    setError(null);
    const e = registerErrors({ ...form, phone: localDigits(form.phone, dial) });
    setErrors(e);
    if (Object.keys(e).length) { setError(t('err_form')); return; }
    setBusy(true);
    try {
      await register({
        email: form.email, password: form.password, role: ROLE[profile][carrierType],
        carrier_type: profile === 'shipper' ? null : carrierType,
        first_name: form.first_name.trim(), last_name: form.last_name.trim(), phone: fullPhone(dial, form.phone), country: form.country, city: form.city.trim(),
      });
      router.replace(profile === 'shipper' ? '/(tabs)/home' : '/verification');
    } catch (err) {
      setError(apiErrorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  const link = (label: string, url: string) => (
    <Text style={{ color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' }} onPress={() => WebBrowser.openBrowserAsync(url)}>{label}</Text>
  );

  return (
    <Screen title={t('create_account')} back testID="register-screen">
      <SectionTitle title={t('register_profile')} />
      <Segmented value={profile} onChange={setProfile} options={[
        { value: 'shipper', label: t('profile_shipper'), icon: 'cube-outline' },
        { value: 'carrier', label: t('profile_carrier'), icon: 'car-outline' },
        { value: 'both', label: t('profile_both'), icon: 'swap-horizontal' },
      ]} />
      <Body small secondary>{t(`profile_${profile}_desc`)}</Body>
      {profile !== 'shipper' && (
        <>
          <Segmented label={t('carrier_type')} value={carrierType} onChange={setCarrierType} options={[
            { value: 'individual', label: t('carrier_individual'), icon: 'person-outline' },
            { value: 'pro', label: t('carrier_pro'), icon: 'business-outline' },
          ]} />
          <Banner tone="info" text={t(carrierType === 'pro' ? 'register_pro_note' : 'register_carrier_note')} />
        </>
      )}

      <SectionTitle title={t('register_identity')} />
      <View style={[row, { gap: SPACING.sm }]}>
        <View style={{ flex: 1 }}><Field label={t('first_name')} value={form.first_name} onChangeText={set('first_name')} error={errors.first_name} autoComplete="given-name" testID="reg-first-name" /></View>
        <View style={{ flex: 1 }}><Field label={t('last_name')} value={form.last_name} onChangeText={set('last_name')} error={errors.last_name} autoComplete="family-name" testID="reg-last-name" /></View>
      </View>
      <PlaceFields countryLabel={t('country')} cityLabel={t('city')} countries={all} country={form.country} city={form.city}
        onCountry={chooseCountry} onCity={set('city')} countryError={errors.country} cityError={errors.city} testID="reg" />
      <View style={[row, { gap: SPACING.sm, alignItems: 'flex-start' }]}>
        <View style={{ width: 96 }}>
          <Field label={t('phone_code')} value={dialLoading ? '…' : dial || '—'} editable={false} testID="reg-phone-code" style={{ textAlign: 'center' }} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t('phone')} value={form.phone} onChangeText={(v) => set('phone')(v.replace(/[^\d\s]/g, ''))} keyboardType="phone-pad"
            autoComplete="tel-national" placeholder={form.country ? '6 12 34 56 78' : t('choose_country_first')} editable={!!form.country}
            error={errors.phone} testID="reg-phone" />
        </View>
      </View>

      <SectionTitle title={t('register_access')} />
      <Field label={t('email')} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} testID="reg-email" />
      <Field label={t('password')} value={form.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" error={errors.password} testID="reg-password" />
      <Field label={t('password_confirm')} value={form.confirm} onChangeText={set('confirm')} secureTextEntry autoComplete="new-password" error={errors.confirm} testID="reg-confirm" />
      <Body small secondary>{t('password_rule')}</Body>

      <Card style={{ marginTop: SPACING.md }}>
        <CheckRow checked={form.accepted} onChange={set('accepted')} error={errors.accepted} testID="reg-terms"
          label={<Text style={{ color: colors.text, fontSize: FONT.sm }}>{t('accept_prefix')} {link(t('terms'), LEGAL_PAGES.terms)} {t('and')} {link(t('privacy'), LEGAL_PAGES.privacy)}</Text>} />
      </Card>
      {!!error && <Banner tone="error" text={error} />}
      <Button label={t('create_account')} icon="checkmark" onPress={submit} loading={busy} testID="reg-submit" />
      <Button variant="text" label={t('have_account')} onPress={() => router.replace('/login')} />
    </Screen>
  );
}
