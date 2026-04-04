/**
 * Firebase Admin SDK — 僅在 Server 端使用
 * 用於建立 LINE Login 的 Custom Token
 */
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  // 優先用 base64 編碼版本（避免 Vercel 環境 \n 格式問題）
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64
    ? Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64, 'base64').toString('utf-8')
    : process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getDatabase(getAdminApp());
