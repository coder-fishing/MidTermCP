import { useSyncExternalStore } from 'react';

/**
 * Keep the server snapshot light and subscribe to the browser color scheme after hydration.
 */
export function useColorScheme() {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => {};
      const query = window.matchMedia('(prefers-color-scheme: dark)');
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
    () => 'light',
  );
}
