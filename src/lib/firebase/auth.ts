import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, db } from './config';
import type { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// =============================================
// Admin check
// =============================================

export function isAdminUid(uid: string): boolean {
  const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map((s) => s.trim());
  return adminUids.includes(uid);
}

// =============================================
// Auth Methods
// =============================================

export async function signInWithGoogle(): Promise<User | null> {
  if (isMobile()) {
    await signInWithRedirect(auth, googleProvider);
    return null; // 頁面會跳轉，不會執行到這裡
  }
  const result = await signInWithPopup(auth, googleProvider);
  return await syncUserToDb(result.user);
}

export async function getGoogleRedirectResult(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  if (!result) return null;
  return await syncUserToDb(result.user);
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return await syncUserToDb(result.user);
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return await syncUserToDb(result.user);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// =============================================
// Sync Firebase Auth user to Realtime Database
// =============================================

export async function syncUserToDb(firebaseUser: FirebaseUser): Promise<User> {
  const userRef = ref(db, `users/${firebaseUser.uid}`);
  const snapshot = await get(userRef);
  const existing = snapshot.exists() ? snapshot.val() : null;

  // 優先使用 Firebase Auth 的 photoURL；
  // 若為空（例如 LINE custom token），保留 DB 裡已存的頭貼，避免覆蓋
  const avatar =
    firebaseUser.photoURL ||
    existing?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || existing?.name || 'U')}&background=0A0A0A&color=FAFAFA`;

  const name = firebaseUser.displayName || existing?.name || '用戶';
  const email = firebaseUser.email || existing?.email || '';

  const userData: User = {
    uid: firebaseUser.uid,
    name,
    email,
    avatar,
    isAdmin: isAdminUid(firebaseUser.uid),
    createdAt: existing?.createdAt ?? Date.now(),
  };

  if (!existing) {
    await set(userRef, userData);
  } else {
    await update(userRef, { name, email, avatar });
  }

  return userData;
}

export async function getUser(uid: string): Promise<User | null> {
  const snapshot = await get(ref(db, `users/${uid}`));
  if (!snapshot.exists()) return null;
  return snapshot.val() as User;
}

// Re-export for convenience
export { onAuthStateChanged, auth };
