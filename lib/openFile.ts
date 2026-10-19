/** Opens a file served behind authentication: downloaded to the cache with the bearer token, then handed to the system viewer. */
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

export async function openProtectedFile(url: string, token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    await WebBrowser.openBrowserAsync(url);
    return;
  }
  const name = url.split('/').pop() || 'document';
  const target = new File(Paths.cache, name);
  if (target.exists) target.delete();
  const file = await File.downloadFileAsync(url, target, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  await Sharing.shareAsync(file.uri, { dialogTitle: name });
}
