import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { User } from 'firebase/auth';

import { AdminLogin } from '@/components/admin-login';
import { useThemeMode } from '@/components/theme-mode-provider';
import { UserDirectory } from '@/components/users/user-directory';
import { Colors } from '@/constants/theme';
import { subscribeToAdminAuth } from '@/lib/admin-auth';

export default function HomeScreen() {
  return <HomeContent />;
}

function HomeContent() {
  const { colorScheme } = useThemeMode();
  const colors = Colors[colorScheme];
  const [admin, setAdmin] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    return subscribeToAdminAuth((user) => {
      setAdmin(user);
      setCheckingSession(false);
    });
  }, []);

  if (checkingSession) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator accessibilityLabel="Đang kiểm tra phiên admin" color={colors.primary} />
      </View>
    );
  }

  return admin ? <UserDirectory /> : <AdminLogin />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
