import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { DocumentPickerField } from '../components/DocumentPickerField';
import { LoginRequired } from '../components/LoginRequired';
import { Screen } from '../components/Screen';
import { Banner, Body, Button, Field, Loading, Segmented } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiErrorText, useQuery } from '../hooks/useQuery';
import { isProCarrier } from '../lib/roles';
import { ProVerification as ProStatus, UploadFile } from '../lib/types';
import { isEmail, isSiret } from '../lib/validation';

/** Company check for professional carriers: SIRET number or Kbis extract. */
export default function ProVerification() {
  const { t } = useLanguage();
  const { api, user } = useAuth();
  const pro = isProCarrier(user);
  const load = useCallback(() => api.get<ProStatus>('/carriers/pro-verification/status'), [api]);
  const { data, loading, reload } = useQuery(pro ? load : null);
  const [docType, setDocType] = useState<'SIRET' | 'KBIS'>('SIRET');
  const [form, setForm] = useState({ company_name: '', siret_number: '', legal_representative: '', company_address: '', company_phone: '', company_email: '' });
  const [file, setFile] = useState<UploadFile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!user) return <Screen title={t('pro_verification')} back><LoginRequired /></Screen>;
  if (!pro) return <Screen title={t('pro_verification')} back><Banner text={t('pro_only')} /></Screen>;
  if (loading || !data) return <Screen title={t('pro_verification')} back><Loading /></Screen>;

  const submit = async () => {
    const e: Record<string, string> = {};
    if (form.company_name.trim().length < 2) e.company_name = 'err_required';
    if (form.legal_representative.trim().length < 2) e.legal_representative = 'err_required';
    if (form.company_address.trim().length < 10) e.company_address = 'err_address_short';
    if (docType === 'SIRET' && !isSiret(form.siret_number)) e.siret_number = 'err_siret';
    if (form.company_email && !isEmail(form.company_email)) e.company_email = 'err_email';
    if (!file && !data.document_url) e.file = 'err_document';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.post('/carriers/pro-verification/submit', {
        company_name: form.company_name.trim(), siret_number: form.siret_number.replace(/\s/g, '') || null, document_type: docType,
        legal_representative: form.legal_representative.trim(), company_address: form.company_address.trim(),
        company_phone: form.company_phone.trim() || null, company_email: form.company_email.trim() || null,
      });
      if (file) await api.upload('/carriers/pro-verification/document', file);
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
    <Screen title={t('pro_verification')} back>
      {data.status === 'VERIFIED' ? <Banner tone="success" text={t('pro_status_VERIFIED')} />
        : data.status === 'PENDING' ? <Banner text={t('pro_status_PENDING')} />
        : data.status === 'REJECTED' ? <Banner tone="error" text={`${t('pro_status_REJECTED')}${data.rejection_reason ? `\n${data.rejection_reason}` : ''}`} />
        : <Banner tone="warning" text={t('pro_intro')} />}
      {data.status !== 'VERIFIED' && (
        <>
          <Segmented label={t('pro_doc_type')} value={docType} onChange={setDocType} options={[{ value: 'SIRET', label: 'SIRET' }, { value: 'KBIS', label: 'Kbis' }]} />
          <Field label={t('company_name')} value={form.company_name} onChangeText={set('company_name')} error={errors.company_name} />
          <Field label={docType === 'SIRET' ? t('siret') : t('siret_optional')} value={form.siret_number} onChangeText={set('siret_number')} keyboardType="number-pad" maxLength={17} error={errors.siret_number} />
          <Field label={t('legal_representative')} value={form.legal_representative} onChangeText={set('legal_representative')} error={errors.legal_representative} />
          <Field label={t('company_address')} value={form.company_address} onChangeText={set('company_address')} multiline error={errors.company_address} />
          <Field label={t('company_phone_optional')} value={form.company_phone} onChangeText={set('company_phone')} keyboardType="phone-pad" />
          <Field label={t('company_email_optional')} value={form.company_email} onChangeText={set('company_email')} keyboardType="email-address" autoCapitalize="none" error={errors.company_email} />
          <DocumentPickerField label={docType === 'SIRET' ? t('siret_document') : t('kbis_document')} hint={t('pro_doc_hint')} file={file} onChange={setFile} uploaded={!!data.document_url} />
          {!!errors.file && <Banner tone="error" text={t(errors.file)} />}
          <Body small secondary>{t('documents_private')}</Body>
          <Button label={t('send_for_review')} icon="business-outline" onPress={submit} loading={busy} />
        </>
      )}
    </Screen>
  );
}
