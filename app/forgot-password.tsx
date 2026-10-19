import React, { useState } from 'react';
import { Screen } from '../components/Screen';
import { Banner, Body, Button, Field } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiErrorText } from '../hooks/useQuery';
import { isEmail } from '../lib/validation';

/** Asks for the reset link; the new password is chosen on the website (link sent by e-mail). */
export default function ForgotPassword() {
  const { t } = useLanguage();
  const { api } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!isEmail(email)) { setError(t('err_email')); return; }
    setBusy(true);
    try {
      await api.request('/auth/request-password-reset', { method: 'POST', body: { email: email.trim().toLowerCase() }, noRefresh: true });
      setSent(true);
    } catch (e) {
      setError(apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('forgot_password')} back>
      {sent ? <Banner tone="success" text={t('reset_sent')} /> : (
        <>
          <Body>{t('reset_intro')}</Body>
          {!!error && <Banner tone="error" text={error} />}
          <Field label={t('email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Button label={t('send_link')} icon="mail-outline" onPress={submit} loading={busy} />
        </>
      )}
    </Screen>
  );
}
