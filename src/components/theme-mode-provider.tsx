import { useColorScheme } from 'react-native';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type ThemeModeContextValue = {
  colorScheme: 'light' | 'dark';
  toggleColorScheme: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);

  const colorScheme = override ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const value = useMemo(
    () => ({
      colorScheme,
      toggleColorScheme: () => setOverride(colorScheme === 'dark' ? 'light' : 'dark'),
    }),
    [colorScheme],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): ThemeModeContextValue {
  const value = useContext(ThemeModeContext);
  if (!value) {
    throw new Error('useThemeMode must be used inside ThemeModeProvider.');
  }
  return value;
}
