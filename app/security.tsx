import React, { useCallback, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { LoginRequired } from '../components/LoginRequired';
import { Screen } from '../components/Screen';
import { Banner, Body, Button, Card, Field, Loading, SectionTitle } from '../components/ui';
import { SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiErrorText, useQuery } from '../hooks/useQuery';

interface Status { two_factor_enabled: boolean; backup_codes_remaining: number }
interface Setup { qr_code: string; secret: string; backup_codes: string[] }

/** Two-factor authentication (TOTP): set-up with an authenticator app, backup codes, deactivation. */
export default function Security() {
  const { t } = useLanguage();
  const { api, user, refreshUser } = useAuth();
  const load = useCallback(() => api.get<Status>('/auth/2fa/status'), [api]);
  const { data, loading, reload } = useQuery(user ? load : null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Screen title={t('security')} back><LoginRequired /></Screen>;
  if (loading || !data) return <Screen title={t('security')} back><Loading /></Screen>;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert(t('error_title'), apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };
  const start = () => run(async () => setSetup(await api.post<Setup>('/auth/2fa/setup')));
  const enable = () => run(async () => {
    await api.post('/auth/2fa/enable', undefined, { token: code.trim() });
    setCode('');
    await reload();
    await refreshUser();
    Alert.alert(t('2fa_enabled'), t('2fa_enabled_msg'));
  });
  const disable = () => run(async () => {
    await api.post('/auth/2fa/disable', undefined, { password, token: code.trim() });
    setCode('');
    setPassword('');
    setSetup(null);
    await reload();
    await refreshUser();
  });
  const otpauth = setup ? `otpauth://totp/Waselni:${encodeURIComponent(user.email)}?secret=${setup.secret}&issuer=Waselni` : '';

  return (
    <Screen title={t('security')} back>
      <SectionTitle title={t('2fa')} />
      <Body secondary>{t('2fa_desc')}</Body>
      {data.two_factor_enabled ? (
        <>
          <Banner tone="success" text={t('2fa_on', { a: data.backup_codes_remaining })} />
          <Card>
            <Body bold>{t('2fa_disable')}</Body>
            <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry />
            <Field label={t('2fa_code')} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={8} />
            <Button variant="outline" icon="lock-open-outline" label={t('2fa_disable')} onPress={disable} loading={busy} disabled={!password || !code} />
          </Card>
        </>
      ) : setup ? (
        <Card>
          <Body>{t('2fa_step1')}</Body>
          <View style={{ alignItems: 'center', marginVertical: SPACING.sm }}>
            <Image source={{ uri: setup.qr_code.startsWith('data:') ? setup.qr_code : `data:image/png;base64,${setup.qr_code}` }} style={{ width: 200, height: 200, backgroundColor: '#FFFFFF' }} />
          </View>
          <Button variant="outline" icon="open-outline" label={t('2fa_open_app')} onPress={() => Linking.openURL(otpauth).catch(() => Alert.alert(t('2fa_no_app')))} />
          <Body small secondary>{t('2fa_manual')}</Body>
          <Body bold>{setup.secret}</Body>
          <Button variant="text" icon="copy-outline" label={t('copy')} onPress={() => Clipboard.setStringAsync(setup.secret)} />
          <Body small secondary>{t('2fa_backup')}</Body>
          <Body bold>{setup.backup_codes.join('   ')}</Body>
          <Button variant="text" icon="copy-outline" label={t('copy_codes')} onPress={() => Clipboard.setStringAsync(setup.backup_codes.join('\n'))} />
          <Field label={t('2fa_step2')} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
          <Button icon="shield-checkmark-outline" label={t('2fa_enable')} onPress={enable} loading={busy} disabled={code.trim().length !== 6} />
        </Card>
      ) : (
        <>
          <Banner tone="warning" text={t('2fa_off')} />
          <Button icon="shield-checkmark-outline" label={t('2fa_setup')} onPress={start} loading={busy} testID="2fa-setup" />
        </>
      )}
      <SectionTitle title={t('password')} />
      <Body secondary>{t('password_change_hint')}</Body>
    </Screen>
  );
}
