import React, { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Avatar } from '../components/Avatar';
import { LoginRequired } from '../components/LoginRequired';
import { PlaceFields } from '../components/PlaceFields';
import { Screen } from '../components/Screen';
import { Body, Button, Field } from '../components/ui';
import { SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCountries } from '../hooks/usePlaces';
import { apiErrorText } from '../hooks/useQuery';
import { toUploadFile } from '../lib/files';

export default function EditProfile() {
  const { t } = useLanguage();
  const { api, user, refreshUser } = useAuth();
  const { all } = useCountries();
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '', last_name: user?.last_name ?? '', phone: user?.phone ?? '',
    country: user?.country ?? '', city: user?.city ?? '', bio: user?.bio ?? '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!user) return <Screen title={t('edit_profile')} back><LoginRequired /></Screen>;

  const changePhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (res.canceled) return;
    try {
      await api.upload('/users/me/avatar', toUploadFile(res.assets[0].uri, res.assets[0].fileName, res.assets[0].mimeType));
      await refreshUser();
    } catch (e) {
      Alert.alert(t('error_title'), apiErrorText(e, t));
    }
  };

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) { Alert.alert(t('error_title'), t('err_form')); return; }
    setBusy(true);
    try {
      await api.patch('/users/me', Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])));
      await refreshUser();
      router.back();
    } catch (e) {
      Alert.alert(t('error_title'), apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('edit_profile')} back>
      <View style={{ alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
        <TouchableOpacity onPress={changePhoto} accessibilityRole="button" accessibilityLabel={t('change_photo')}><Avatar user={user} size={96} /></TouchableOpacity>
        <Button variant="text" icon="camera-outline" label={t('change_photo')} onPress={changePhoto} />
      </View>
      <Field label={t('first_name')} value={form.first_name} onChangeText={set('first_name')} />
      <Field label={t('last_name')} value={form.last_name} onChangeText={set('last_name')} />
      <Field label={t('phone')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <PlaceFields countryLabel={t('country')} cityLabel={t('city')} countries={all} country={form.country} city={form.city} onCountry={set('country')} onCity={set('city')} />
      <Field label={t('bio')} value={form.bio} onChangeText={set('bio')} multiline numberOfLines={4} placeholder={t('bio_placeholder')} style={{ minHeight: 90, textAlignVertical: 'top' }} />
      <Body small secondary>{t('email_readonly', { a: user.email })}</Body>
      <Button label={t('save')} icon="checkmark" onPress={save} loading={busy} />
    </Screen>
  );
}
