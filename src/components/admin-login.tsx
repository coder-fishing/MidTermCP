import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TextInputInstance } from 'react-native';

import { Colors } from '@/constants/theme';
import { ThemeToggle } from '@/components/theme-toggle';
import { useThemeMode } from '@/components/theme-mode-provider';
import { signInAdmin } from '@/lib/admin-auth';

export function AdminLogin() {
  const { width } = useWindowDimensions();
  const { colorScheme } = useThemeMode();
  const colors = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordInput = useRef<TextInputInstance>(null);
  const wide = width >= 760;

  async function handleSubmit() {
    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || !password) {
      setError('Nhập email hợp lệ và mật khẩu của admin.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await signInAdmin(cleanEmail, password);
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Email hoặc mật khẩu chưa đúng.'
          : code === 'auth/too-many-requests'
            ? 'Đăng nhập tạm thời bị giới hạn. Thử lại sau ít phút.'
            : 'Chưa đăng nhập được. Kiểm tra kết nối và tài khoản admin trong Firebase Authentication.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardArea}>
        <ScrollView
          contentContainerStyle={styles.screenContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <View style={styles.brand}>
              <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
                <Text style={[styles.brandMarkText, { color: colors.onPrimary }]}>M</Text>
              </View>
              <Text style={[styles.brandName, { color: colors.text }]}>MidTermCP</Text>
            </View>
            <ThemeToggle />
          </View>

          <View style={styles.center}>
            <View
              style={[
                styles.loginPanel,
                { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                wide && styles.loginPanelWide,
              ]}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>KHU VỰC QUẢN TRỊ</Text>
              <Text style={[styles.title, { color: colors.text }]}>Đăng nhập admin</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Dùng tài khoản admin đã tạo trong Firebase Authentication.
              </Text>

              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                  <TextInput
                    accessibilityLabel="Email admin"
                    autoCapitalize="none"
                    autoComplete="email"
                    blurOnSubmit={false}
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    onSubmitEditing={() => passwordInput.current?.focus()}
                    placeholder="admin@example.com"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                    ]}
                    textContentType="emailAddress"
                    value={email}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>Mật khẩu</Text>
                  <TextInput
                    accessibilityLabel="Mật khẩu admin"
                    autoComplete="current-password"
                    onChangeText={setPassword}
                    onSubmitEditing={handleSubmit}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor={colors.textSecondary}
                    ref={passwordInput}
                    returnKeyType="done"
                    secureTextEntry
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                    ]}
                    textContentType="password"
                    value={password}
                  />
                </View>

                {!!error && (
                  <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                    {error}
                  </Text>
                )}

                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.submit,
                    { backgroundColor: colors.primary },
                    (pressed || busy) && styles.pressed,
                  ]}>
                  {busy ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={[styles.submitText, { color: colors.onPrimary }]}>Đăng nhập</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={[styles.footer, { color: colors.textSecondary }]}>MidTermCP · Quản lý hồ sơ</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  screenContent: {
    flexGrow: 1,
  },
  topBar: {
    width: '100%',
    maxWidth: 1120,
    minHeight: 68,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    fontSize: 17,
    fontWeight: '700',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  loginPanel: {
    width: '100%',
    maxWidth: 520,
    padding: 28,
    borderWidth: 1,
    borderRadius: 18,
  },
  loginPanelWide: {
    padding: 36,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
  },
  form: {
    gap: 18,
    marginTop: 28,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    lineHeight: 21,
  },
  submit: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: 18,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  footer: {
    alignSelf: 'center',
    paddingVertical: 18,
    fontSize: 13,
  },
});
