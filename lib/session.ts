/** Persists the session tokens: Android Keystore (SecureStore) on phones, browser storage on the web preview. */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'waselni_session';

export interface StoredSession { access_token: string; refresh_token: string }

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = Platform.OS === 'web' ? await AsyncStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    const s = raw ? (JSON.parse(raw) as StoredSession) : null;
    return s?.access_token && s.refresh_token ? s : null;
  } catch {
    return null;
  }
}

export async function saveSession(s: StoredSession | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (s) await AsyncStorage.setItem(KEY, JSON.stringify(s));
      else await AsyncStorage.removeItem(KEY);
    } else if (s) await SecureStore.setItemAsync(KEY, JSON.stringify(s));
    else await SecureStore.deleteItemAsync(KEY);
  } catch (error) {
    console.error('Error saving session:', error);
  }
}
