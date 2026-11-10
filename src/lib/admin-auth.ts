import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';

import { auth } from './firebase';

export async function signInAdmin(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAdminAuth(
  onChange: (user: User | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, onChange);
}
