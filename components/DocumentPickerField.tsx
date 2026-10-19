import React from 'react';
import { Alert, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../contexts/LanguageContext';
import { toUploadFile } from '../lib/files';
import { UploadFile } from '../lib/types';
import { Body, Button, Card, StatusPill, useRow } from './ui';
import { SPACING } from '../constants/theme';

/** Chooses an identity or company document: photo taken now, image from the gallery, or PDF. */
export const DocumentPickerField: React.FC<{ label: string; hint?: string; file: UploadFile | null; onChange: (f: UploadFile) => void; uploaded?: boolean }> = (
  { label, hint, file, onChange, uploaded },
) => {
  const { t } = useLanguage();
  const row = useRow();

  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('camera_denied')); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled) onChange(toUploadFile(res.assets[0].uri, res.assets[0].fileName, res.assets[0].mimeType));
  };
  const gallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled) onChange(toUploadFile(res.assets[0].uri, res.assets[0].fileName, res.assets[0].mimeType));
  };
  const pdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!res.canceled) onChange(toUploadFile(res.assets[0].uri, res.assets[0].name, res.assets[0].mimeType));
  };

  return (
    <Card>
      <View style={[row, { alignItems: 'center', gap: SPACING.sm }]}>
        <View style={{ flex: 1 }}><Body bold>{label}</Body></View>
        {file ? <StatusPill label={t('file_ready')} tone="info" /> : uploaded ? <StatusPill label={t('file_sent')} tone="success" /> : null}
      </View>
      {!!hint && <Body small secondary>{hint}</Body>}
      {!!file && <Body small>{file.name}</Body>}
      <View style={[row, { gap: SPACING.sm, flexWrap: 'wrap' }]}>
        <Button variant="outline" icon="camera-outline" label={t('take_photo')} onPress={camera} />
        <Button variant="outline" icon="images-outline" label={t('gallery')} onPress={gallery} />
        <Button variant="outline" icon="document-outline" label={t('pdf_file')} onPress={pdf} />
      </View>
    </Card>
  );
};
