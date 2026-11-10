import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { ThemeModeProvider, useThemeMode } from '@/components/theme-mode-provider';

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <ThemedAppLayout />
    </ThemeModeProvider>
  );
}

function ThemedAppLayout() {
  const { colorScheme } = useThemeMode();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </ThemeProvider>
  );
}
