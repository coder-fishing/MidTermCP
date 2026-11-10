import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

import { app, db } from './firebase-core';

export { app, db };
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
