import React from 'react';
import { router } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { Button, EmptyState } from './ui';

/** Placeholder for screens that need an account. */
export const LoginRequired: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useLanguage();
  return (
    <EmptyState icon="lock-closed-outline" title={t('login_required')} message={message ?? t('login_required_msg')}
      action={<>
        <Button label={t('login')} icon="log-in-outline" onPress={() => router.push('/login')} testID="go-login" />
        <Button variant="text" label={t('create_account')} onPress={() => router.push('/register')} />
      </>} />
  );
};
