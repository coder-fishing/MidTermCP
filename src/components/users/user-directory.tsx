import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/constants/theme';
import { ThemeToggle } from '@/components/theme-toggle';
import { useThemeMode } from '@/components/theme-mode-provider';
import { signOutAdmin } from '@/lib/admin-auth';
import { uploadAvatar } from '@/lib/cloudinary';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type UserListItem,
} from '@/lib/users';

import { UserForm, type UserFormValues } from './user-form';

const PAGE_SIZE = 5;

function friendlyLoadError(cause: unknown): string {
  const code = (cause as { code?: string }).code;
  if (code === 'permission-denied') {
    return 'Firestore từ chối truy cập. Kiểm tra UID admin trong Firestore Rules và tài khoản đang đăng nhập.';
  }
  return 'Chưa tải được danh sách. Kiểm tra kết nối rồi thử tải lại.';
}

export function UserDirectory() {
  const { width } = useWindowDimensions();
  const { colorScheme } = useThemeMode();
  const colors = Colors[colorScheme];
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'email'>('email');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const wide = width >= 760;

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setUsers(await listUsers());
    } catch (cause) {
      setLoadError(friendlyLoadError(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let subscribed = true;
    listUsers()
      .then((data) => {
        if (subscribed) setUsers(data);
      })
      .catch((cause: unknown) => {
        if (subscribed) setLoadError(friendlyLoadError(cause));
      })
      .finally(() => {
        if (subscribed) setLoading(false);
      });
    return () => {
      subscribed = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('vi');
    return users
      .filter((user) =>
        !needle || `${user.name} ${user.email}`.toLocaleLowerCase('vi').includes(needle),
      )
      .sort((left, right) => left[sortField].localeCompare(right[sortField], 'vi'));
  }, [search, sortField, users]);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, pageCount);
  const visibleUsers = useMemo(
    () => filteredUsers.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE),
    [activePage, filteredUsers],
  );
  const firstVisibleUser = filteredUsers.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1;
  const lastVisibleUser = Math.min(activePage * PAGE_SIZE, filteredUsers.length);

  function openCreateForm() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEditForm(user: UserListItem) {
    setEditingUser(user);
    setFormOpen(true);
  }

  async function saveUser(values: UserFormValues) {
    let avtUrl = editingUser?.avtUrl ?? '';
    if (values.selectedImage) {
      avtUrl = await uploadAvatar(values.selectedImage);
    }

    if (editingUser) {
      await updateUser(editingUser.id, {
        email: values.email,
        name: values.name,
        newPassword: values.newPassword,
        avtUrl,
      });
    } else {
      await createUser({
        email: values.email,
        name: values.name,
        newPassword: values.newPassword,
        avtUrl,
      });
    }

    setFormOpen(false);
    setEditingUser(null);
    await loadDirectory();
  }

  async function removeUser(id: string) {
    setBusyUserId(id);
    setLoadError('');
    try {
      await deleteUser(id);
      setUsers((current) => current.filter((user) => user.id !== id));
    } catch (cause) {
      setLoadError(friendlyLoadError(cause));
    } finally {
      setBusyUserId(null);
    }
  }

  function askToRemove(user: UserListItem) {
    const message = `Xóa hồ sơ của ${user.name}?`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(message)) void removeUser(user.id);
      return;
    }
    Alert.alert('Xóa hồ sơ người dùng', message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa hồ sơ', style: 'destructive', onPress: () => void removeUser(user.id) },
    ]);
  }

  async function handleSignOut() {
    setSigningOut(true);
    setLoadError('');
    try {
      await signOutAdmin();
    } catch {
      setLoadError('Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setSigningOut(false);
    }
  }

  function exportUserData() {
    const records = users.map((user) => ({
      email: user.email,
      name: user.name,
      pass: user.pass,
      avtUrl: user.avtUrl,
    }));
    const json = JSON.stringify(records, null, 2);
    const fileName = `midterm-users-${new Date().toISOString().slice(0, 10)}.json`;
    const warning = 'File JSON có chứa giá trị mật khẩu đã băm. Hãy lưu và chia sẻ file ở nơi an toàn.';

    const saveExport = () => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }

      void Share.share({ title: fileName, message: json });
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Xuất ${users.length} hồ sơ thành JSON?\n\n${warning}`)) saveExport();
      return;
    }

    Alert.alert('Xuất dữ liệu người dùng', `${users.length} hồ sơ. ${warning}`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Tiếp tục', onPress: saveExport },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.page, { maxWidth: wide ? 1120 : 720 }]}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }, !wide && styles.topBarNarrow]}>
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
              <Text style={[styles.brandMarkText, { color: colors.onPrimary }]}>M</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.text }]}>MidTermCP</Text>
          </View>
          <View style={styles.topActions}>
            <ThemeToggle />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={signingOut ? 'Đang đăng xuất' : 'Đăng xuất'}
              accessibilityHint="Đăng xuất tài khoản admin"
              disabled={signingOut}
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.iconButton,
                { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                pressed && styles.pressed,
              ]}>
              {signingOut ? (
                <ActivityIndicator accessibilityLabel="Đang đăng xuất" color={colors.text} />
              ) : (
                <SymbolView
                  name={{
                    ios: 'rectangle.portrait.and.arrow.right',
                    android: 'logout',
                    web: 'logout',
                  }}
                  size={20}
                  tintColor={colors.text}
                />
              )}
            </Pressable>
          </View>
        </View>

        <View style={[styles.headingBlock, !wide && styles.headingBlockNarrow]}>
          <View style={styles.headingCopy}>
            <Text style={[styles.title, { color: colors.text }]}>Quản lý người dùng</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tìm, thêm và cập nhật hồ sơ trong danh bạ.
            </Text>
          </View>
          <View style={styles.headingActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xuất danh sách người dùng thành JSON"
              accessibilityHint="Xuất toàn bộ hồ sơ, bao gồm giá trị mật khẩu đã băm"
              disabled={loading || users.length === 0}
              onPress={exportUserData}
              style={({ pressed }) => [
                styles.exportButton,
                { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                (loading || users.length === 0) && styles.exportButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'square.and.arrow.down', android: 'download', web: 'download' }}
                size={17}
                tintColor={colors.text}
              />
              <Text style={[styles.exportButtonText, { color: colors.text }]}>Xuất JSON</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={openCreateForm}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Thêm người dùng</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.directoryPanel, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={[styles.searchBar, { borderBottomColor: colors.border }, !wide && styles.searchBarNarrow]}>
            <TextInput
              accessibilityLabel="Tìm theo tên hoặc email"
              autoCapitalize="none"
              onChangeText={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên hoặc email"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
              style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={search}
            />
            <View style={styles.countWrap}>
              <Text style={[styles.count, { color: colors.accent }]}>{filteredUsers.length}</Text>
              <Text style={[styles.countLabel, { color: colors.textSecondary }]}>hồ sơ</Text>
            </View>
          </View>

          <View style={[styles.sortBar, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>Sắp xếp theo</Text>
            <View style={styles.sortOptions}>
              <SortButton
                title="Email"
                selected={sortField === 'email'}
                colors={colors}
                onPress={() => {
                  setSortField('email');
                  setCurrentPage(1);
                }}
              />
              <SortButton
                title="Họ tên"
                selected={sortField === 'name'}
                colors={colors}
                onPress={() => {
                  setSortField('name');
                  setCurrentPage(1);
                }}
              />
            </View>
          </View>

          {loadError ? (
            <View style={styles.stateBlock}>
              <Text accessibilityRole="alert" style={[styles.stateTitle, { color: colors.text }]}>Không tải được danh sách</Text>
              <Text style={[styles.stateBody, { color: colors.textSecondary }]}>{loadError}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadDirectory()}
                style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.border }, pressed && styles.pressed]}>
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Thử tải lại</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.stateBlock}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.stateBody, { color: colors.textSecondary }]}>Đang tải hồ sơ…</Text>
            </View>
          ) : users.length === 0 ? (
            <View style={styles.stateBlock}>
              <Text style={[styles.stateTitle, { color: colors.text }]}>Danh bạ đang trống</Text>
              <Text style={[styles.stateBody, { color: colors.textSecondary }]}>Thêm hồ sơ đầu tiên để bắt đầu quản lý.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={openCreateForm}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
                <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Thêm hồ sơ đầu tiên</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.results}>
              <FlashList
                data={visibleUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <UserRow
                    busy={busyUserId === item.id}
                    colors={colors}
                    onDelete={() => askToRemove(item)}
                    onEdit={() => openEditForm(item)}
                    user={item}
                    wide={wide}
                  />
                )}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                ListEmptyComponent={(
                  <View style={styles.stateBlock}>
                    <Text style={[styles.stateTitle, { color: colors.text }]}>Không tìm thấy hồ sơ</Text>
                    <Text style={[styles.stateBody, { color: colors.textSecondary }]}>Thử từ khóa tên hoặc email khác.</Text>
                  </View>
                )}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
              />
              {filteredUsers.length > 0 && (
                <View style={[styles.pagination, { borderTopColor: colors.border }]}>
                  <Text style={[styles.paginationSummary, { color: colors.textSecondary }]}>
                    {firstVisibleUser}–{lastVisibleUser} / {filteredUsers.length}
                  </Text>
                  <View style={styles.paginationActions}>
                    <PaginationButton
                      label="Trang trước"
                      title="Trước"
                      disabled={activePage === 1}
                      colors={colors}
                      onPress={() => setCurrentPage(Math.max(1, activePage - 1))}
                    />
                    <Text accessibilityLiveRegion="polite" style={[styles.pageLabel, { color: colors.text }]}>
                      {activePage} / {pageCount}
                    </Text>
                    <PaginationButton
                      label="Trang sau"
                      title="Sau"
                      disabled={activePage === pageCount}
                      colors={colors}
                      onPress={() => setCurrentPage(Math.min(pageCount, activePage + 1))}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {formOpen && (
        <UserForm
          initialUser={editingUser}
          onCancel={() => {
            setFormOpen(false);
            setEditingUser(null);
          }}
          onSave={saveUser}
        />
      )}
    </SafeAreaView>
  );
}

function SortButton({
  title,
  selected,
  colors,
  onPress,
}: {
  title: string;
  selected: boolean;
  colors: (typeof Colors)[keyof typeof Colors];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sortButton,
        {
          backgroundColor: selected ? colors.backgroundSelected : colors.backgroundElement,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.sortButtonText, { color: selected ? colors.primary : colors.text }]}>
        {title}
      </Text>
    </Pressable>
  );
}

function PaginationButton({
  label,
  title,
  disabled,
  colors,
  onPress,
}: {
  label: string;
  title: string;
  disabled: boolean;
  colors: (typeof Colors)[keyof typeof Colors];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.paginationButton,
        { borderColor: colors.border, backgroundColor: colors.backgroundElement },
        disabled && styles.paginationButtonDisabled,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.paginationButtonText, { color: disabled ? colors.textSecondary : colors.text }]}>
        {title}
      </Text>
    </Pressable>
  );
}

function UserRow({
  user,
  colors,
  wide,
  busy,
  onEdit,
  onDelete,
}: {
  user: UserListItem;
  colors: (typeof Colors)[keyof typeof Colors];
  wide: boolean;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = user.name.trim().slice(0, 1).toLocaleUpperCase('vi') || 'M';
  return (
    <View style={[styles.userRow, !wide && styles.userRowNarrow]}>
      <View style={styles.userIdentity}>
        {user.avtUrl ? (
          <Image source={{ uri: user.avtUrl }} contentFit="cover" style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.backgroundSelected }]}>
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>{initials}</Text>
          </View>
        )}
        <View style={styles.userCopy}>
          <Text numberOfLines={2} style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
          <Text selectable numberOfLines={2} style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
        </View>
      </View>
      <View style={styles.rowActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sửa hồ sơ ${user.name}`}
          disabled={busy}
          onPress={onEdit}
          style={({ pressed }) => [styles.rowButton, { borderColor: colors.border }, pressed && styles.pressed]}>
          <Text style={[styles.rowButtonText, { color: colors.primary }]}>Sửa</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xóa hồ sơ ${user.name}`}
          disabled={busy}
          onPress={onDelete}
          style={({ pressed }) => [styles.rowButton, { borderColor: colors.border }, pressed && styles.pressed]}>
          <Text style={[styles.rowButtonText, { color: colors.danger }]}>{busy ? 'Đang xóa…' : 'Xóa'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  page: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  topBar: {
    minHeight: 68,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#87978D',
  },
  topBarNarrow: {
    minHeight: 76,
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 28,
    paddingBottom: 22,
  },
  headingBlockNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingTop: 20,
    gap: 14,
  },
  headingCopy: {
    flex: 1,
    minWidth: 0,
  },
  headingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 5,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 9,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  exportButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  exportButtonDisabled: {
    opacity: 0.55,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  directoryPanel: {
    flex: 1,
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  results: {
    flex: 1,
    minHeight: 0,
  },
  searchBar: {
    minHeight: 76,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBarNarrow: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 13,
    fontSize: 15,
  },
  countWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  count: {
    fontSize: 20,
    fontWeight: '700',
  },
  countLabel: {
    fontSize: 13,
  },
  sortBar: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortLabel: {
    fontSize: 13,
  },
  sortOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  pagination: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  paginationSummary: {
    fontSize: 13,
  },
  paginationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationButton: {
    minWidth: 56,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  paginationButtonDisabled: {
    opacity: 0.55,
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pageLabel: {
    minWidth: 38,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  userRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 14,
  },
  userRowNarrow: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: 12,
  },
  userIdentity: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userCopy: {
    minWidth: 0,
    flex: 1,
    gap: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  userName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    lineHeight: 20,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rowButton: {
    minWidth: 52,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  rowButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stateBlock: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  stateTitle: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  stateBody: {
    maxWidth: 430,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },
  secondaryButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
