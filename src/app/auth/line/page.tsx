'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, db } from '@/lib/firebase/config';
import { isAdminUid } from '@/lib/firebase/auth';
import Image from 'next/image';
import toast from 'react-hot-toast';

function LineAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      const errorMap: Record<string, string> = {
        line_denied: '已取消 LINE 登入',
        state_mismatch: '安全驗證失敗，請重試',
        line_failed: 'LINE 登入失敗，請稍後再試',
      };
      setErrorMsg(errorMap[error] || 'LINE 登入失敗');
      setStatus('error');
      return;
    }

    if (!token) {
      setErrorMsg('缺少驗證 Token');
      setStatus('error');
      return;
    }

    (async () => {
      try {
        const credential = await signInWithCustomToken(auth, token);
        const user = credential.user;

        // 從 custom token claims 取 LINE profile，寫入 DB
        const tokenResult = await user.getIdTokenResult();
        const claims = tokenResult.claims;

        const uid = user.uid;
        const userData = {
          uid,
          name: (claims.lineName as string) || '用戶',
          email: (claims.lineEmail as string) || '',
          avatar: (claims.lineAvatar as string) ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent((claims.lineName as string) || 'U')}&background=0A0A0A&color=FAFAFA`,
          isAdmin: isAdminUid(uid),
          lineUserId: claims.lineUserId as string,
          provider: 'line',
        };

        const userRef = ref(db, `users/${uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          await update(userRef, {
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
            isAdmin: userData.isAdmin,
          });
        } else {
          await set(userRef, { ...userData, createdAt: Date.now() });
        }

        toast.success('LINE 登入成功！');
        router.replace('/');
      } catch (err) {
        console.error('LINE sign-in error:', err);
        setErrorMsg('登入失敗，Token 可能已過期，請重試');
        setStatus('error');
      }
    })();
  }, [searchParams, router]);

  return (
    <>
      {status === 'processing' ? (
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-gray-700 border-t-brand-accent rounded-full animate-spin mx-auto" />
          <p className="text-brand-gray-300 text-sm">LINE 登入中，請稍候...</p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-red-400 text-sm">{errorMsg}</p>
          <button
            onClick={() => router.push('/login')}
            className="btn-secondary"
          >
            返回登入頁
          </button>
        </div>
      )}
    </>
  );
}

export default function LineAuthPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-brand-black">
      <Image src="/logo.png" alt="RLG REPTILE" width={120} height={44} className="object-contain mb-6" />
      <Suspense
        fallback={
          <div className="w-8 h-8 border-2 border-brand-gray-700 border-t-brand-accent rounded-full animate-spin" />
        }
      >
        <LineAuthContent />
      </Suspense>
    </div>
  );
}
