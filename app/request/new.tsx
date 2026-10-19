import React, { useState } from 'react';
import { Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { DateField } from '../../components/DateField';
import { LoginRequired } from '../../components/LoginRequired';
import { PlaceFields } from '../../components/PlaceFields';
import { Screen } from '../../components/Screen';
import { Banner, Body, Button, Field, SectionTitle, Segmented, Select, useRow } from '../../components/ui';
import { PACKAGE_TYPES, PackageType } from '../../constants/packages';
import { BORDER_RADIUS, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCountries } from '../../hooks/usePlaces';
import { apiErrorText } from '../../hooks/useQuery';
import { toUploadFile } from '../../lib/files';
import { addDays, parseNumber, toIsoDate } from '../../lib/format';
import { isShipper } from '../../lib/roles';
import { ShippingMode, ShipRequest } from '../../lib/types';
import { requestErrors, RequestForm } from '../../lib/validation';

const MAX_PHOTOS = 4;

/** A sender posts a shipping request, with optional photos of the parcel. */
export default function NewRequest() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { api, user } = useAuth();
  const { origins, destinations } = useCountries();
  const row = useRow();
  const today = toIsoDate(new Date());
  const [mode, setMode] = useState<ShippingMode>('TERRESTRIAL');
  const [pkg, setPkg] = useState<PackageType | null>(null);
  const [form, setForm] = useState<RequestForm>({
    origin_country: '', origin_city: '', destination_country: '', destination_city: '',
    weight: '', package_type: '', deadline: addDays(today, 30), description: '',
  });
  const [dims, setDims] = useState({ length: '', width: '', height: '' });
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof RequestForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!user) return <Screen title={t('send_parcel')} back><LoginRequired /></Screen>;
  if (!isShipper(user)) return <Screen title={t('send_parcel')} back><Banner tone="warning" text={t('shipper_only')} /></Screen>;

  const pickPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_PHOTOS - photos.length, quality: 0.7 });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets].slice(0, MAX_PHOTOS));
  };

  const submit = async () => {
    const e = requestErrors({ ...form, package_type: pkg ?? '' }, today);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const dim = (v: string) => parseNumber(v) ?? null;
      const created = await api.post<ShipRequest>('/requests', {
        origin_country: form.origin_country, origin_city: form.origin_city.trim(),
        destination_country: form.destination_country, destination_city: form.destination_city.trim(),
        weight: parseNumber(form.weight), length: dim(dims.length), width: dim(dims.width), height: dim(dims.height),
        package_type: t(`pkg_${pkg}`), mode, deadline: `${form.deadline}T00:00:00`, description: form.description.trim(),
      });
      for (const p of photos) {
        try {
          await api.upload(`/requests/${created.id}/photos`, toUploadFile(p.uri, p.fileName, p.mimeType));
        } catch (err) {
          console.error('Photo upload failed:', err);
        }
      }
      router.replace({ pathname: '/request/[id]', params: { id: created.id } });
    } catch (err) {
      Alert.alert(t('error_title'), apiErrorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('send_parcel')} back>
      <Segmented label={t('transport_mode')} value={mode} onChange={setMode} options={[
        { value: 'TERRESTRIAL', label: t('mode_road'), icon: 'car-outline' },
        { value: 'AIR', label: t('mode_air'), icon: 'airplane-outline' },
      ]} />
      <SectionTitle title={t('departure')} />
      <PlaceFields countryLabel={t('country')} cityLabel={t('city')} countries={origins} country={form.origin_country} city={form.origin_city}
        onCountry={set('origin_country')} onCity={set('origin_city')} countryError={errors.origin_country} cityError={errors.origin_city} testID="origin" />
      <SectionTitle title={t('arrival')} />
      <PlaceFields countryLabel={t('country')} cityLabel={t('city')} countries={destinations} country={form.destination_country} city={form.destination_city}
        onCountry={set('destination_country')} onCity={set('destination_city')} countryError={errors.destination_country} cityError={errors.destination_city} testID="destination" />
      <SectionTitle title={t('package_details')} />
      <Select label={t('package_type')} value={pkg} options={[...PACKAGE_TYPES]} display={(k) => t(`pkg_${k}`)} onChange={setPkg} placeholder={t('choose')} error={errors.package_type} />
      <Field label={t('weight_kg_label')} value={form.weight} onChangeText={set('weight')} keyboardType="decimal-pad" error={errors.weight} testID="weight" />
      <Body small secondary>{t('dimensions_optional')}</Body>
      <View style={[row, { gap: SPACING.sm }]}>
        {(['length', 'width', 'height'] as const).map((k) => (
          <View key={k} style={{ flex: 1 }}>
            <Field label={t(`dim_${k}`)} value={dims[k]} onChangeText={(v) => setDims((d) => ({ ...d, [k]: v }))} keyboardType="decimal-pad" />
          </View>
        ))}
      </View>
      <DateField label={t('deadline')} value={form.deadline} minimumDate={today} error={errors.deadline} onChange={set('deadline')} />
      <Field label={t('description')} value={form.description} onChangeText={set('description')} multiline numberOfLines={4} error={errors.description}
        placeholder={t('description_placeholder')} style={{ minHeight: 100, textAlignVertical: 'top' }} testID="description" />
      <SectionTitle title={t('photos_optional')} />
      <ScrollView horizontal contentContainerStyle={{ gap: SPACING.sm }}>
        {photos.map((p, i) => (
          <TouchableOpacity key={p.uri} onPress={() => setPhotos((all) => all.filter((_, j) => j !== i))} accessibilityLabel={t('remove')}>
            <Image source={{ uri: p.uri }} style={{ width: 88, height: 88, borderRadius: BORDER_RADIUS.md }} />
            <Ionicons name="close-circle" size={22} color={colors.error} style={{ position: 'absolute', top: 2, right: 2 }} />
          </TouchableOpacity>
        ))}
        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity onPress={pickPhotos} accessibilityRole="button" accessibilityLabel={t('add_photos')}
            style={{ width: 88, height: 88, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="camera-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
      {Object.keys(errors).length > 0 && <Banner tone="error" text={t('err_form')} />}
      <Button label={t('publish')} icon="checkmark" onPress={submit} loading={busy} testID="publish" />
    </Screen>
  );
}
