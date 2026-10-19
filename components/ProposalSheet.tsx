import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiErrorText } from '../hooks/useQuery';
import { ApiError } from '../lib/api';
import { parseNumber } from '../lib/format';
import { Contract, ShipRequest } from '../lib/types';
import { Body, Button, Field, Sheet } from './ui';

/** A carrier proposes a price for a shipping request (creates a contract the sender can accept). */
export const ProposalSheet: React.FC<{ visible: boolean; onClose: () => void; request: ShipRequest }> = ({ visible, onClose, request }) => {
  const { t } = useLanguage();
  const { api, user } = useAuth();
  const [priceText, setPriceText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const price = parseNumber(priceText);
    if (price == null || price <= 0) { setError('err_number'); return; }
    setError(undefined);
    setBusy(true);
    try {
      const contract = await api.post<Contract>('/contracts', { request_id: request.id, carrier_id: user?.id, proposed_price: price });
      onClose();
      router.push({ pathname: '/contract/[id]', params: { id: contract.id } });
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        onClose();
        Alert.alert(t('verification_needed'), e.message, [
          { text: t('cancel'), style: 'cancel' },
          { text: t('verify_identity'), onPress: () => router.push('/verification') },
        ]);
      } else Alert.alert(t('error_title'), apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('make_proposal')}>
      <Body small secondary>{t('proposal_intro', { a: request.weight })}</Body>
      <Field label={t('proposed_price')} value={priceText} onChangeText={setPriceText} keyboardType="decimal-pad" error={error} testID="proposal-price" />
      <Button label={t('send_proposal')} icon="send" onPress={send} loading={busy} testID="proposal-send" />
      <Button variant="text" label={t('cancel')} onPress={onClose} />
    </Sheet>
  );
};
