import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/Screen';
import { Banner, Body, Button, Field } from '../components/ui';
import { SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiErrorText } from '../hooks/useQuery';
import { isEmail, isTotpCode } from '../lib/validation';

/** Sign-in, with the two-factor code step when the account has 2FA. */
export default function Login() {
  const { t } = useLanguage();
  const { login, verify2fa } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));

  const submit = async () => {
    setError(null);
    if (!isEmail(email) || !password) { setError(t('err_login_fields')); return; }
    setBusy(true);
    try {
      const res = await login(email, password);
      if (res) setChallenge(res.temporary_token);
      else done();
    } catch (e) {
      setError(apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    setError(null);
    if (!challenge || !isTotpCode(code)) { setError(t('err_2fa_code')); return; }
    setBusy(true);
    try {
      await verify2fa(challenge, code);
      done();
    } catch (e) {
      setError(apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('login')} back testID="login-screen">
      <View style={{ alignItems: 'center', marginVertical: SPACING.md }}>
        <Image source={require('../assets/images/logo.png')} style={{ width: 220, height: 110 }} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
      {!!error && <Banner tone="error" text={error} />}
      {challenge ? (
        <>
          <Body>{t('2fa_prompt')}</Body>
          <Field label={t('2fa_code')} value={code} onChangeText={setCode} keyboardType="number-pad" autoFocus maxLength={8} textContentType="oneTimeCode" testID="2fa-code" />
          <Body small secondary>{t('2fa_backup_hint')}</Body>
          <Button label={t('verify')} icon="shield-checkmark-outline" onPress={submitCode} loading={busy} testID="2fa-submit" />
          <Button variant="text" label={t('back')} onPress={() => { setChallenge(null); setCode(''); }} />
        </>
      ) : (
        <>
          <Field label={t('email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" testID="login-email" />
          <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" testID="login-password" onSubmitEditing={submit} />
          <Button label={t('login')} icon="log-in-outline" onPress={submit} loading={busy} testID="login-submit" />
          <Button variant="text" label={t('forgot_password')} onPress={() => router.push('/forgot-password')} />
          <View style={{ height: SPACING.md }} />
          <Body secondary small>{t('no_account')}</Body>
          <Button variant="outline" label={t('create_account')} icon="person-add-outline" onPress={() => router.replace('/register')} />
        </>
      )}
    </Screen>
  );
}
