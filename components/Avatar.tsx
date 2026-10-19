import React from 'react';
import { Image, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SITE_URL } from '../lib/config';
import { fileUrl } from '../lib/files';
import { initials } from '../lib/format';
import { PublicUser } from '../lib/types';

/** Profile photo, or the initials on a coloured disc. */
export const Avatar: React.FC<{ user?: PublicUser | null; size?: number }> = ({ user, size = 44 }) => {
  const { colors } = useTheme();
  const uri = fileUrl(SITE_URL, user?.avatar_url);
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.chip }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.onPrimaryContainer, fontWeight: '700', fontSize: size * 0.38 }}>{initials(user)}</Text>
    </View>
  );
};
