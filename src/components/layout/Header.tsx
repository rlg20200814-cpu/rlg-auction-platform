'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Settings, User, Menu, X } from 'lucide-react';
import { signOut } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('已登出');
    router.push('/');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/8">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="RLG REPTILE" width={80} height={32} className="object-contain" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/auction" className="btn-ghost">即時競標</Link>
          <Link href="/shop" className="btn-ghost">零售商品</Link>
          <Link href="/about" className="btn-ghost">關於我們</Link>
          {user?.isAdmin && (
            <Link href="/admin" className="btn-ghost">
              <Settings className="w-4 h-4" />
              後台管理
            </Link>
          )}
          {!loading && (
            user ? (
              <div className="flex items-center gap-3 ml-2">
                <Link href="/profile" className="flex items-center gap-2 text-sm text-brand-gray-300 hover:text-brand-white transition-colors">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.name} width={28} height={28} className="rounded-full ring-1 ring-brand-gray-700" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-gray-700 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </Link>
                <button onClick={handleSignOut} className="btn-ghost p-2" aria-label="登出">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary py-1.5 px-4 text-xs ml-2">
                LOGIN
              </Link>
            )
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden btn-ghost p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="選單"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/8 bg-black px-4 py-3 space-y-1">
          <Link href="/auction" className="flex items-center gap-2 py-2.5 text-sm text-brand-gray-300" onClick={() => setMenuOpen(false)}>
            即時競標
          </Link>
          <Link href="/shop" className="flex items-center gap-2 py-2.5 text-sm text-brand-gray-300" onClick={() => setMenuOpen(false)}>
            零售商品
          </Link>
          <Link href="/about" className="flex items-center gap-2 py-2.5 text-sm text-brand-gray-300" onClick={() => setMenuOpen(false)}>
            關於我們
          </Link>
          {user?.isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 py-2.5 text-sm text-brand-gray-300" onClick={() => setMenuOpen(false)}>
              <Settings className="w-4 h-4" /> 後台管理
            </Link>
          )}
          <div className="divider" />
          {!loading && (
            user ? (
              <>
                <div className="flex items-center gap-3 py-2">
                  {user.avatar && (
                    <Image src={user.avatar} alt={user.name} width={32} height={32} className="rounded-full" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-brand-gray-500">{user.email}</p>
                  </div>
                </div>
                <button onClick={handleSignOut} className="flex items-center gap-2 py-2.5 text-sm text-brand-gray-400 w-full text-left">
                  <LogOut className="w-4 h-4" /> 登出
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary w-full mt-2 text-xs tracking-widest" onClick={() => setMenuOpen(false)}>
                LOGIN
              </Link>
            )
          )}
        </div>
      )}
    </header>
  );
}
