import { Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/components/theme-mode-provider';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useThemeMode();
  const colors = Colors[colorScheme];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={colorScheme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
      accessibilityHint="Đổi giao diện sáng hoặc tối"
      onPress={toggleColorScheme}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.border, backgroundColor: colors.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <SymbolView
        name={colorScheme === 'dark'
          ? { ios: 'sun.max.fill', android: 'sunny', web: 'sunny' }
          : { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' }}
        size={20}
        tintColor={colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
