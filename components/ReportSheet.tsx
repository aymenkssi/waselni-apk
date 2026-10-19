import React, { useState } from 'react';
import { Alert } from 'react-native';
import { translations } from '../constants/translations';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiErrorText } from '../hooks/useQuery';
import { Button, Field, Select, Sheet } from './ui';

const REASONS = ['report_scam', 'report_inappropriate', 'report_fake', 'report_prohibited', 'report_other'] as const;

/** "Report" dialog: sends the report to the moderation team. */
export const ReportSheet: React.FC<{ visible: boolean; onClose: () => void; targetType: 'USER' | 'REQUEST' | 'OFFER' | 'MESSAGE'; targetId: string }> = (
  { visible, onClose, targetType, targetId },
) => {
  const { t } = useLanguage();
  const { api } = useAuth();
  const [reason, setReason] = useState<(typeof REASONS)[number]>('report_scam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      // The reason is stored in French, like on the website, so the moderators read one language.
      await api.post('/reports', { target_type: targetType, target_id: targetId, reason: translations.fr[reason], details: details.trim() || null });
      onClose();
      setDetails('');
      Alert.alert(t('report_sent'), t('report_sent_msg'));
    } catch (e) {
      Alert.alert(t('error_title'), apiErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('report')}>
      <Select label={t('report_reason')} value={reason} options={[...REASONS]} display={(r) => t(r)} onChange={setReason} />
      <Field label={t('report_details')} value={details} onChangeText={setDetails} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
      <Button label={t('send')} icon="flag" onPress={send} loading={busy} />
      <Button variant="text" label={t('cancel')} onPress={onClose} />
    </Sheet>
  );
};
