import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from './firebase';
import { hashPassword } from './password';

export type UserDocument = {
  email: string;
  name: string;
  pass: string;
  avtUrl: string;
};

export type UserListItem = UserDocument & { id: string };

export type UserInput = {
  email: string;
  name: string;
  newPassword: string;
  avtUrl: string;
};

export type UserUpdateInput = {
  email: string;
  name: string;
  newPassword?: string;
  avtUrl: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateProfile(email: string, name: string): void {
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Vui lòng nhập email hợp lệ.');
  }
  if (!name.trim()) {
    throw new Error('Họ tên không được để trống.');
  }
}

async function ensureEmailAvailable(email: string, exceptId?: string): Promise<void> {
  const matchingUsers = await getDocs(
    query(collection(db, 'users'), where('email', '==', email)),
  );

  if (matchingUsers.docs.some((user) => user.id !== exceptId)) {
    throw new Error('Email này đã được sử dụng.');
  }
}

export async function listUsers(): Promise<UserListItem[]> {
  const snapshot = await getDocs(collection(db, 'users'));

  return snapshot.docs
    .map((user) => ({ id: user.id, ...user.data() }) as UserListItem)
    .sort((left, right) => left.email.localeCompare(right.email));
}

export async function createUser(input: UserInput): Promise<string> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  validateProfile(email, name);
  await ensureEmailAvailable(email);

  const pass = await hashPassword(input.newPassword);
  const created = await addDoc(collection(db, 'users'), {
    email,
    name,
    pass,
    avtUrl: input.avtUrl.trim(),
  } satisfies UserDocument);

  return created.id;
}

export async function updateUser(
  id: string,
  input: UserUpdateInput,
): Promise<void> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  validateProfile(email, name);
  await ensureEmailAvailable(email, id);

  const updates: Pick<UserDocument, 'email' | 'name' | 'avtUrl'> &
    Partial<Pick<UserDocument, 'pass'>> = {
      email,
      name,
      avtUrl: input.avtUrl.trim(),
    };

  if (input.newPassword?.trim()) {
    updates.pass = await hashPassword(input.newPassword);
  }

  await updateDoc(doc(db, 'users', id), updates);
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', id));
}
