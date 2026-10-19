import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportSheet } from '../../components/ReportSheet';
import { HeaderIcon, ScreenHeader } from '../../components/ScreenHeader';
import { ErrorState, Loading, useRow } from '../../components/ui';
import { BORDER_RADIUS, FONT, SPACING } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { apiErrorText, useQuery } from '../../hooks/useQuery';
import { SITE_URL } from '../../lib/config';
import { fileUrl, toUploadFile } from '../../lib/files';
import { openProtectedFile } from '../../lib/openFile';
import { formatDateTime, formatTime, fullName, toIsoDate } from '../../lib/format';
import { Conversation, Message, Paginated } from '../../lib/types';

const POLL_MS = 5000;
const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i;

/** Chat about an offer or a request; new messages are fetched every few seconds while the screen is open. */
export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language, align } = useLanguage();
  const { colors } = useTheme();
  const { api, user, accessToken } = useAuth();
  const row = useRow();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const list = useRef<FlatList<Message>>(null);

  const loadConv = useCallback(() => api.get<Conversation>(`/conversations/${id}`), [api, id]);
  const conv = useQuery(user ? loadConv : null);

  const fetchMessages = useCallback(async () => {
    const res = await api.get<Paginated<Message>>(`/conversations/${id}/messages`, { limit: 100 });
    setMessages((prev) => (prev.length === res.items.length && prev[prev.length - 1]?.id === res.items[res.items.length - 1]?.id ? prev : res.items));
  }, [api, id]);

  useEffect(() => {
    if (!user) return;
    const tick = () => { fetchMessages().catch(() => undefined); };
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, POLL_MS);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [fetchMessages, user]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const msg = await api.post<Message>(`/conversations/${id}/messages`, { text: body });
      setText('');
      setMessages((m) => [...m, msg]);
    } catch (e) {
      Alert.alert(t('error_title'), apiErrorText(e, t));
    } finally {
      setSending(false);
    }
  };

  const attach = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (res.canceled) return;
    const file = res.assets[0];
    setSending(true);
    try {
      const msg = await api.upload<Message>(`/conversations/${id}/messages/attachment`, toUploadFile(file.uri, file.name, file.mimeType));
      setMessages((m) => [...m, msg]);
    } catch (e) {
      Alert.alert(t('error_title'), apiErrorText(e, t));
    } finally {
      setSending(false);
    }
  };

  const today = toIsoDate(new Date());
  const other = conv.data?.other_user;
  const otherId = conv.data?.participants.find((p) => p !== user?.id);
  const about = conv.data?.request_id ? { pathname: '/request/[id]' as const, id: conv.data.request_id } : conv.data?.offer_id ? { pathname: '/offer/[id]' as const, id: conv.data.offer_id } : null;

  const renderItem = ({ item }: { item: Message }) => {
    const mine = item.sender_id === user?.id;
    const local = toIsoDate(new Date(item.created_at));
    return (
      <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginVertical: 3 }}>
        <View style={{ maxWidth: '82%', backgroundColor: mine ? colors.bubbleMine : colors.bubbleOther, borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm + 2,
          borderWidth: mine ? 0 : 1, borderColor: colors.border, gap: 4 }}>
          {item.attachments.map((a) => {
            const uri = fileUrl(SITE_URL, a)!;
            return IMAGE_RE.test(a) ? (
              <Image key={a} source={{ uri, headers: { Authorization: `Bearer ${accessToken() ?? ''}` } }} style={{ width: 200, height: 200, borderRadius: BORDER_RADIUS.md }} />
            ) : (
              <TouchableOpacity key={a} onPress={() => openProtectedFile(uri, accessToken()).catch((e) => Alert.alert(t('error_title'), String(e)))} style={[row, { gap: 6, alignItems: 'center' }]}>
                <Ionicons name="document-attach-outline" size={20} color={mine ? colors.onBubbleMine : colors.primary} />
                <Text style={{ color: mine ? colors.onBubbleMine : colors.primary, textDecorationLine: 'underline' }}>{t('attachment')}</Text>
              </TouchableOpacity>
            );
          })}
          {!!item.text && <Text style={{ color: mine ? colors.onBubbleMine : colors.text, fontSize: FONT.md, textAlign: align }}>{item.text}</Text>}
          <Text style={{ color: mine ? colors.onBubbleMine : colors.textSecondary, opacity: 0.75, fontSize: FONT.xs, alignSelf: 'flex-end' }}>
            {local === today ? formatTime(item.created_at) : formatDateTime(item.created_at, language)}
          </Text>
        </View>
      </View>
    );
  };

  const right = (
    <>
      {about && <HeaderIcon icon="information-circle-outline" label={t('see_ad')} onPress={() => router.push({ pathname: about.pathname, params: { id: about.id } })} />}
      {otherId && <HeaderIcon icon="flag-outline" label={t('report')} onPress={() => setReporting(true)} />}
    </>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={other ? fullName(other) : t('conversation')} back right={right} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {conv.loading ? <Loading /> : conv.error ? <ErrorState message={conv.error} onRetry={conv.reload} /> : (
          <FlatList ref={list} data={messages} keyExtractor={(m) => m.id} renderItem={renderItem}
            contentContainerStyle={{ padding: SPACING.md }} onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })} />
        )}
        <View style={[row, { padding: SPACING.sm, gap: SPACING.sm, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={attach} disabled={sending} accessibilityLabel={t('attach')} style={{ padding: 8 }}>
            <Ionicons name="attach" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TextInput value={text} onChangeText={setText} placeholder={t('write_message')} placeholderTextColor={colors.textSecondary} multiline maxLength={2000} testID="message-input"
            style={{ flex: 1, maxHeight: 120, color: colors.text, backgroundColor: colors.surfaceAlt, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 10, fontSize: FONT.md, textAlign: align }} />
          <TouchableOpacity onPress={send} disabled={sending || !text.trim()} accessibilityLabel={t('send')} testID="message-send"
            style={{ backgroundColor: colors.accent, borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: sending || !text.trim() ? 0.5 : 1 }}>
            <Ionicons name="send" size={20} color={colors.onAccent} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {otherId && <ReportSheet visible={reporting} onClose={() => setReporting(false)} targetType="USER" targetId={otherId} />}
    </SafeAreaView>
  );
}
