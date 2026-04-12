'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmail, signInWithGoogle, registerWithEmail, getGoogleRedirectResult } from '@/lib/firebase/auth';
import LineLoginButton from '@/components/auth/LineLoginButton';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lineError = searchParams.get('error');
  const lineDetail = searchParams.get('detail');
  const [mode, setMode] = useState<Mode>('login');

  useEffect(() => {
    getGoogleRedirectResult().then((user) => {
      if (user) {
        toast.success('登入成功！');
        router.push('/');
      }
    }).catch(() => {});
  }, [router]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  const lineErrorMap: Record<string, string> = {
    line_denied: '已取消 LINE 登入',
    state_mismatch: '安全驗證失敗，請重試',
    line_failed: 'LINE 登入失敗，請稍後再試',
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('登入成功！');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Google 登入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(form.email, form.password);
        toast.success('登入成功！');
      } else {
        if (!form.name.trim()) {
          toast.error('請輸入姓名');
          setLoading(false);
          return;
        }
        await registerWithEmail(form.email, form.password, form.name);
        toast.success('註冊成功！歡迎加入 RLG REPTILE');
      }
      router.push('/');
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'auth/user-not-found': '帳號不存在',
        'auth/wrong-password': '密碼錯誤',
        'auth/email-already-in-use': '此 Email 已被使用',
        'auth/weak-password': '密碼至少需要 6 個字元',
        'auth/invalid-email': 'Email 格式不正確',
        'auth/too-many-requests': '嘗試次數過多，請稍後再試',
      };
      toast.error(errorMap[err.code] || err.message || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* LINE error */}
      {lineError && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {lineErrorMap[lineError] || 'LINE 登入失敗'}
          {lineDetail && <div className="mt-1 text-xs opacity-70 break-all">{lineDetail}</div>}
        </div>
      )}

      {/* LINE Login — 主要按鈕 */}
      <LineLoginButton disabled={loading} className="mb-3" />

      {/* Tabs */}
      <div className="flex mb-6 bg-brand-gray-900 rounded-lg p-1">
        <button
          onClick={() => setMode('login')}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-md transition-all',
            mode === 'login' ? 'bg-brand-white text-brand-black' : 'text-brand-gray-400'
          )}
        >
          登入
        </button>
        <button
          onClick={() => setMode('register')}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-md transition-all',
            mode === 'register' ? 'bg-brand-white text-brand-black' : 'text-brand-gray-400'
          )}
        >
          註冊
        </button>
      </div>

      {/* Google Login */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="btn-secondary w-full mb-4 gap-3"
      >
        <GoogleIcon />
        使用 Google 登入
      </button>

      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-brand-gray-800" />
        <span className="text-xs text-brand-gray-600">或使用 Email 登入</span>
        <div className="flex-1 h-px bg-brand-gray-800" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'register' && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="姓名"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input pl-10"
              autoComplete="name"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-500 pointer-events-none" />
          <input
            type="email"
            placeholder="電子郵件"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="input pl-10"
            autoComplete="email"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-500 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="密碼"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="input pl-10 pr-10"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray-500 hover:text-brand-gray-300"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 mt-2"
        >
          {loading ? '處理中...' : mode === 'login' ? '登入' : '建立帳號'}
        </button>
      </form>

      <p className="text-center text-xs text-brand-gray-600 mt-6">
        繼續即表示你同意我們的服務條款與隱私政策
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-black">
      {/* Logo */}
      <Link href="/" className="flex items-center mb-8">
        <Image src="/logo.png" alt="RLG REPTILE" width={120} height={44} className="object-contain" />
      </Link>

      <Suspense
        fallback={
          <div className="w-8 h-8 border-2 border-brand-gray-700 border-t-brand-accent rounded-full animate-spin" />
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
