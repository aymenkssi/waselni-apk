import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { DateField } from '../components/DateField';
import { DocumentPickerField } from '../components/DocumentPickerField';
import { LoginRequired } from '../components/LoginRequired';
import { PlaceFields } from '../components/PlaceFields';
import { Screen } from '../components/Screen';
import { Banner, Body, Button, Field, Loading, SectionTitle, Select } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCountries } from '../hooks/usePlaces';
import { apiErrorText } from '../hooks/useQuery';
import { useVerification } from '../hooks/useVerification';
import { addDays, toIsoDate } from '../lib/format';
import { isProCarrier } from '../lib/roles';
import { CarrierVerification, UploadFile, User } from '../lib/types';

const DOC_TYPES = ['PASSPORT', 'RESIDENCE_PERMIT', 'DRIVING_LICENSE'] as const;

/** Carrier identity check: identity document + proof of address (less than 3 months), reviewed by the Waselni team. */
export default function Verification() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const verification = useVerification();
  if (!user) return <Screen title={t('verify_identity')} back><LoginRequired /></Screen>;
  if (!verification.required) return <Screen title={t('verify_identity')} back><Banner text={t('verification_not_needed')} /></Screen>;
  if (!verification.data) return <Screen title={t('verify_identity')} back><Loading /></Screen>;
  return <VerificationForm user={user} data={verification.data} reload={verification.reload} />;
}

/** Previously submitted values (if any) prefill the form. */
function VerificationForm({ user, data, reload }: { user: User; data: CarrierVerification; reload: () => Promise<void> }) {
  const { t } = useLanguage();
  const { api } = useAuth();
  const { all } = useCountries();
  const today = toIsoDate(new Date());
  const saved = data as unknown as Record<string, unknown>;
  const pick = (k: string, fallback: string) => (typeof saved[k] === 'string' && saved[k] ? (saved[k] as string) : fallback);
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]>(pick('identity_doc_type', 'PASSPORT') as (typeof DOC_TYPES)[number]);
  const [form, setForm] = useState({
    identity_first_name: pick('identity_first_name', user.first_name ?? ''), identity_last_name: pick('identity_last_name', user.last_name ?? ''),
    identity_birth_date: pick('identity_birth_date', '1990-01-01'), identity_doc_number: pick('identity_doc_number', ''),
    address_street: pick('address_street', ''), address_city: pick('address_city', user.city ?? ''),
    address_postal_code: pick('address_postal_code', ''), address_country: pick('address_country', user.country ?? ''),
  });
  const [identity, setIdentity] = useState<UploadFile | null>(null);
  const [proof, setProof] = useState<UploadFile | null>(null);
  const [proofDate, setProofDate] = useState(today);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const verification = { status: data.status, data };

  const status = verification.status;
  const docsSent = !!verification.data.documents_complete;

  const submit = async () => {
    const e: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) if (!v.trim()) e[k] = 'err_required';
    if (!identity && !data.identity_doc_url) e.identity = 'err_document';
    if (!proof && !data.address_proof_url) e.proof = 'err_document';
    if (proofDate < addDays(today, -90)) e.proofDate = 'err_proof_old';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.post('/carriers/verification/submit', { identity_doc_type: docType, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) });
      if (identity) await api.upload('/carriers/verification/identity-document', identity);
      if (proof) await api.upload('/carriers/verification/address-proof', proof, { document_date: proofDate });
      await reload();
      Alert.alert(t('verification_sent'), t('verification_sent_msg'));
      router.back();
    } catch (err) {
      Alert.alert(t('error_title'), apiErrorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('verify_identity')} back>
      {status === 'VERIFIED' ? <Banner tone="success" text={t('verif_status_VERIFIED')} />
        : status === 'PENDING' && docsSent ? <Banner tone="info" text={t('verif_status_PENDING')} />
        : status === 'REJECTED' ? <Banner tone="error" text={`${t('verif_status_REJECTED')}${verification.data.rejection_reason ? `\n${verification.data.rejection_reason}` : ''}`} />
        : <Banner tone="warning" text={t('verif_intro')} />}
      {isProCarrier(user) && (
        <Button variant="outline" icon="business-outline" label={t('pro_verification')} onPress={() => router.push('/pro-verification')} />
      )}
      {status !== 'VERIFIED' && (
        <>
          <SectionTitle title={t('identity_document')} />
          <Select label={t('doc_type')} value={docType} options={[...DOC_TYPES]} display={(d) => t(`doc_${d}`)} onChange={setDocType} />
          <Field label={t('first_name')} value={form.identity_first_name} onChangeText={set('identity_first_name')} error={errors.identity_first_name} />
          <Field label={t('last_name')} value={form.identity_last_name} onChangeText={set('identity_last_name')} error={errors.identity_last_name} />
          <DateField label={t('birth_date')} value={form.identity_birth_date} onChange={set('identity_birth_date')} />
          <Field label={t('doc_number')} value={form.identity_doc_number} onChangeText={set('identity_doc_number')} autoCapitalize="characters" error={errors.identity_doc_number} />
          <DocumentPickerField label={t('identity_document')} hint={t('identity_hint')} file={identity} onChange={setIdentity} uploaded={!!verification.data.identity_doc_url} />
          {!!errors.identity && <Banner tone="error" text={t(errors.identity)} />}

          <SectionTitle title={t('address')} />
          <Field label={t('street')} value={form.address_street} onChangeText={set('address_street')} error={errors.address_street} autoComplete="street-address" />
          <Field label={t('postal_code')} value={form.address_postal_code} onChangeText={set('address_postal_code')} error={errors.address_postal_code} autoComplete="postal-code" />
          <PlaceFields countryLabel={t('country')} cityLabel={t('city')} countries={all} country={form.address_country} city={form.address_city}
            onCountry={set('address_country')} onCity={set('address_city')} countryError={errors.address_country} cityError={errors.address_city} />
          <DocumentPickerField label={t('address_proof')} hint={t('address_proof_hint')} file={proof} onChange={setProof} uploaded={!!verification.data.address_proof_url} />
          <DateField label={t('address_proof_date')} value={proofDate} onChange={setProofDate} error={errors.proofDate} />
          {!!errors.proof && <Banner tone="error" text={t(errors.proof)} />}

          <Body small secondary>{t('documents_private')}</Body>
          <Button label={t('send_for_review')} icon="shield-checkmark-outline" onPress={submit} loading={busy} testID="verification-submit" />
        </>
      )}
    </Screen>
  );
}
