import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { TextInputInstance } from 'react-native';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/components/theme-mode-provider';
import type { UserListItem } from '@/lib/users';

export type UserFormValues = {
  email: string;
  name: string;
  newPassword: string;
  selectedImage: ImagePicker.ImagePickerAsset | null;
};

type UserFormProps = {
  initialUser: UserListItem | null;
  onSave: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
};

export function UserForm({ initialUser, onSave, onCancel }: UserFormProps) {
  const { width } = useWindowDimensions();
  const { colorScheme } = useThemeMode();
  const colors = Colors[colorScheme];
  const [email, setEmail] = useState(initialUser?.email ?? '');
  const [name, setName] = useState(initialUser?.name ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailInput = useRef<TextInputInstance>(null);
  const passwordInput = useRef<TextInputInstance>(null);
  const wide = width >= 760;
  const previewUri = selectedImage?.uri ?? initialUser?.avtUrl;

  async function chooseImage() {
    setPicking(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0] ?? null);
      }
    } catch {
      setError('Không mở được thư viện ảnh. Kiểm tra quyền truy cập ảnh rồi thử lại.');
    } finally {
      setPicking(false);
    }
  }

  async function handleSave() {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!name.trim()) {
      setError('Nhập họ tên người dùng.');
      return;
    }
    if (!initialUser && !newPassword.trim()) {
      setError('Nhập mật khẩu cho hồ sơ mới.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onSave({
        email: cleanEmail,
        name: name.trim(),
        newPassword,
        selectedImage,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được hồ sơ. Thử lại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible
      statusBarTranslucent>
      <View style={[styles.scrim, { backgroundColor: colors.scrim }]}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalPosition}>
          <View
            accessibilityViewIsModal
            style={[
              styles.panel,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border },
              wide && styles.panelWide,
            ]}>
            <View style={styles.headingText}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>HỒ SƠ NGƯỜI DÙNG</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                {initialUser ? 'Sửa hồ sơ' : 'Thêm người dùng'}
              </Text>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}>
              <View style={styles.avatarRow}>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} contentFit="cover" style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.backgroundSelected }]}>
                    <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                      {name.trim().slice(0, 1).toLocaleUpperCase('vi') || 'M'}
                    </Text>
                  </View>
                )}
                <View style={styles.photoControls}>
                  <Text style={[styles.label, { color: colors.text }]}>Ảnh đại diện</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={picking}
                    onPress={chooseImage}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      pressed && styles.pressed,
                    ]}>
                    {picking ? <ActivityIndicator color={colors.primary} /> : (
                      <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                        {selectedImage || initialUser?.avtUrl ? 'Chọn ảnh khác' : 'Chọn ảnh'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Họ tên</Text>
                <TextInput
                  accessibilityLabel="Họ tên người dùng"
                  autoComplete="name"
                  onChangeText={setName}
                  onSubmitEditing={() => emailInput.current?.focus()}
                  blurOnSubmit={false}
                  placeholder="Nhập họ tên"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  textContentType="name"
                  returnKeyType="next"
                  value={name}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <TextInput
                  accessibilityLabel="Email người dùng"
                  autoCapitalize="none"
                  autoComplete="email"
                  ref={emailInput}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  onSubmitEditing={() => passwordInput.current?.focus()}
                  blurOnSubmit={false}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  value={email}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Mật khẩu</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    accessibilityLabel={initialUser ? 'Mật khẩu mới, không bắt buộc' : 'Mật khẩu người dùng'}
                    autoComplete="new-password"
                    ref={passwordInput}
                    onChangeText={setNewPassword}
                    onSubmitEditing={handleSave}
                    placeholder={initialUser ? 'Để trống để giữ mật khẩu hiện tại' : 'Nhập mật khẩu mới'}
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    style={[styles.input, styles.passwordInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    textContentType="newPassword"
                    returnKeyType="done"
                    value={newPassword}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onPress={() => setShowPassword((visible) => !visible)}
                    style={({ pressed }) => [styles.passwordToggle, { borderColor: colors.border }, pressed && styles.pressed]}>
                    <Text style={[styles.passwordToggleText, { color: colors.text }]}>
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </Text>
                  </Pressable>
                </View>
                {initialUser && (
                  <Text style={[styles.helper, { color: colors.textSecondary }]}>
                    Mật khẩu cũ không hiển thị. Chỉ nhập khi muốn đổi.
                  </Text>
                )}
              </View>

              {!!error && (
                <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                  {error}
                </Text>
              )}
            </ScrollView>

            <View style={[styles.actions, { borderTopColor: colors.border }]}>
              <Pressable
                accessibilityRole="button"
                disabled={busy || picking}
                onPress={onCancel}
                style={({ pressed }) => [styles.actionButton, { borderColor: colors.border }, pressed && styles.pressed]}>
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Hủy</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busy || picking}
                onPress={handleSave}
                style={({ pressed }) => [styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }, (pressed || busy) && styles.pressed]}>
                {busy ? <ActivityIndicator color={colors.onPrimary} /> : (
                  <Text style={[styles.submitText, { color: colors.onPrimary }]}>
                    {initialUser ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalPosition: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '94%',
    flexShrink: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
  },
  panelWide: {
    padding: 28,
  },
  headingText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  formContent: {
    gap: 18,
    paddingTop: 22,
    paddingBottom: 8,
  },
  formScroll: {
    flexShrink: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 25,
    fontWeight: '700',
  },
  photoControls: {
    gap: 7,
  },
  field: {
    gap: 7,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
  },
  passwordToggle: {
    minWidth: 54,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
  },
  passwordToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryButton: {
    minHeight: 42,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    minHeight: 46,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 14,
  },
  primaryButton: {
    borderColor: 'transparent',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
