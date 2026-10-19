import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ApiError } from '../lib/api';
import { Conversation } from '../lib/types';
import { apiErrorText } from './useQuery';

/** Opens (or creates) the conversation about an offer or a request with its author. */
export function useContact() {
  const { api, user } = useAuth();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const contact = async (participantId: string, about: { offer_id?: string; request_id?: string }) => {
    if (!user) { router.push('/login'); return; }
    setBusy(true);
    try {
      const conv = await api.post<Conversation>('/conversations', { participant_id: participantId, ...about });
      router.push({ pathname: '/conversation/[id]', params: { id: conv.id } });
    } catch (e) {
      // 403: carrier whose identity is not verified yet.
      if (e instanceof ApiError && e.status === 403) {
        Alert.alert(t('verification_needed'), e.message, [
          { text: t('cancel'), style: 'cancel' },
          { text: t('verify_identity'), onPress: () => router.push('/verification') },
        ]);
      } else Alert.alert(t('error_title'), apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };
  return { contact, busy };
}
