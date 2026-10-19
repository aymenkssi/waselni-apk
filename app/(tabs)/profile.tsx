import React from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Avatar } from '../../components/Avatar';
import { Rating } from '../../components/Rating';
import { Screen } from '../../components/Screen';
import { Body, Button, Card, Chip, ChipRow, Divider, LinkRow, SectionTitle, StatusPill, Title, useRow } from '../../components/ui';
import { SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Language, useLanguage } from '../../contexts/LanguageContext';
import { ThemePreference, useTheme } from '../../contexts/ThemeContext';
import { useVerification } from '../../hooks/useVerification';
import { LEGAL_PAGES } from '../../lib/config';
import { fullName } from '../../lib/format';
import { isProCarrier, roleKey } from '../../lib/roles';

const LANGUAGE_NAMES: Record<Language, string> = { fr: 'Français', en: 'English', ar: 'العربية' };

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { preference, setPreference, colors } = useTheme();
  const { user, logout } = useAuth();
  const verification = useVerification();
  const row = useRow();

  const confirmLogout = () => Alert.alert(t('logout'), t('logout_confirm'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('logout'), style: 'destructive', onPress: logout },
  ]);

  return (
    <Screen title={t('tab_profile')}>
      {user ? (
        <Card>
          <View style={[row, { gap: SPACING.md, alignItems: 'center' }]}>
            <Avatar user={user} size={64} />
            <View style={{ flex: 1, gap: 4 }}>
              <Title>{fullName(user)}</Title>
              <Body small secondary>{user.email}</Body>
              <View style={[row, { gap: SPACING.sm, flexWrap: 'wrap' }]}>
                <StatusPill label={t(roleKey(user))} tone="info" />
                {verification.required && <StatusPill label={t(`verif_short_${verification.status}`)} tone={verification.status === 'VERIFIED' ? 'success' : verification.status === 'REJECTED' ? 'error' : 'warning'} />}
              </View>
              <Rating user={user} />
            </View>
          </View>
          <Button variant="outline" icon="create-outline" label={t('edit_profile')} onPress={() => router.push('/edit-profile')} />
        </Card>
      ) : (
        <Card>
          <Title>{t('welcome')}</Title>
          <Body secondary>{t('welcome_msg')}</Body>
          <Button label={t('login')} icon="log-in-outline" onPress={() => router.push('/login')} testID="profile-login" />
          <Button variant="outline" label={t('create_account')} icon="person-add-outline" onPress={() => router.push('/register')} />
        </Card>
      )}

      {user && (
        <>
          <SectionTitle title={t('my_activity')} />
          <Card>
            <LinkRow icon="list-outline" title={t('my_ads')} subtitle={t('my_ads_desc')} onPress={() => router.push('/my-ads')} />
            <Divider />
            <LinkRow icon="document-text-outline" title={t('my_contracts')} subtitle={t('my_contracts_desc')} onPress={() => router.push('/contracts')} />
            {verification.required && (
              <>
                <Divider />
                <LinkRow icon="shield-checkmark-outline" title={t('verify_identity')} subtitle={t(`verif_short_${verification.status}`)} onPress={() => router.push('/verification')} />
              </>
            )}
            {isProCarrier(user) && (
              <>
                <Divider />
                <LinkRow icon="business-outline" title={t('pro_verification')} subtitle={t('pro_verification_desc')} onPress={() => router.push('/pro-verification')} />
              </>
            )}
            <Divider />
            <LinkRow icon="lock-closed-outline" title={t('security')} subtitle={t('security_desc')} onPress={() => router.push('/security')} />
          </Card>
        </>
      )}

      <SectionTitle title={t('settings')} />
      <Card>
        <Body small secondary>{t('language')}</Body>
        <ChipRow>
          {(Object.keys(LANGUAGE_NAMES) as Language[]).map((l) => (
            <Chip key={l} label={LANGUAGE_NAMES[l]} selected={language === l} onPress={() => setLanguage(l)} testID={`lang-${l}`} />
          ))}
        </ChipRow>
        <Divider />
        <Body small secondary>{t('theme')}</Body>
        <ChipRow>
          {(['system', 'light', 'dark'] as ThemePreference[]).map((p) => (
            <Chip key={p} label={t(`theme_${p}`)} selected={preference === p} onPress={() => setPreference(p)} />
          ))}
        </ChipRow>
      </Card>

      <SectionTitle title={t('help')} />
      <Card>
        <LinkRow icon="help-circle-outline" title={t('faq')} onPress={() => WebBrowser.openBrowserAsync(LEGAL_PAGES.faq)} />
        <Divider />
        <LinkRow icon="mail-outline" title={t('contact_us')} onPress={() => WebBrowser.openBrowserAsync(LEGAL_PAGES.contact)} />
        <Divider />
        <LinkRow icon="document-outline" title={t('terms')} onPress={() => WebBrowser.openBrowserAsync(LEGAL_PAGES.terms)} />
        <Divider />
        <LinkRow icon="shield-outline" title={t('privacy')} onPress={() => WebBrowser.openBrowserAsync(LEGAL_PAGES.privacy)} />
      </Card>

      {user && (
        <>
          <Button variant="outline" icon="log-out-outline" label={t('logout')} onPress={confirmLogout} testID="logout" />
          <Button variant="text" icon="trash-outline" label={t('delete_account')} color={colors.error} onPress={() => router.push('/delete-account')} testID="profile-delete-account" />
        </>
      )}
      <View style={{ alignItems: 'center', marginTop: SPACING.md }}>
        <Body small secondary>{`Waselni ${Constants.expoConfig?.version ?? ''}`}</Body>
      </View>
    </Screen>
  );
}
