/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#20352E',
    background: '#F4F3ED',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6EEE8',
    textSecondary: '#596C63',
    primary: '#155D50',
    onPrimary: '#FFFFFF',
    accent: '#A85D24',
    border: '#D8E0DA',
    danger: '#B42318',
    scrim: '#18352E66',
  },
  dark: {
    text: '#EDF4F0',
    background: '#14201B',
    backgroundElement: '#1D2B25',
    backgroundSelected: '#2B4036',
    textSecondary: '#B4C3BA',
    primary: '#77C6AB',
    onPrimary: '#11251D',
    accent: '#E6A05B',
    border: '#394B40',
    danger: '#F97066',
    scrim: '#000000B8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
