import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LoginRequired } from '../components/LoginRequired';
import { Screen } from '../components/Screen';
import { Banner, Body, Button, Card, Field, SectionTitle } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiErrorText } from '../hooks/useQuery';
import { LEGAL_PAGES } from '../lib/config';

/** Permanent account deletion (Google Play requirement), confirmed by the password and the 2FA code. */
export default function DeleteAccount() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { api, user, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Screen title={t('delete_account')} back><LoginRequired /></Screen>;

  const remove = async () => {
    setBusy(true);
    try {
      await api.post('/users/me/delete', { password, code: code.trim() || null });
      await logout();
      router.replace('/(tabs)/home');
      Alert.alert(t('account_deleted'), t('account_deleted_msg'));
    } catch (e) {
      Alert.alert(t('error_title'), apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };
  const confirm = () => Alert.alert(t('delete_account'), t('delete_confirm_final'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('delete'), style: 'destructive', onPress: remove },
  ]);

  return (
    <Screen title={t('delete_account')} back>
      <Banner tone="warning" text={t('delete_account_intro')} />
      <SectionTitle title={t('deleted_data')} />
      <Card>
        <Body small>{t('deleted_data_list')}</Body>
      </Card>
      <Body small secondary>{t('delete_contracts_note')}</Body>
      <Button variant="text" icon="open-outline" label={t('delete_more_info')} onPress={() => WebBrowser.openBrowserAsync(LEGAL_PAGES.accountDeletion)} />
      <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" testID="delete-password" />
      {user.two_factor_enabled && (
        <Field label={t('2fa_code')} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={8} testID="delete-code" />
      )}
      <Button label={t('delete_account_button')} icon="trash-outline" color={colors.error} onPress={confirm} loading={busy}
        disabled={!password || (!!user.two_factor_enabled && !code.trim())} testID="delete-account" />
    </Screen>
  );
}
