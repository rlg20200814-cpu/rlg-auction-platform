'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogOut, User, Menu, X, Settings } from 'lucide-react';
import { signOut } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('已登出');
    router.push('/');
    setMenuOpen(false);
  };

  const navLinks: { href: string; label: string; exact?: boolean }[] = [
    { href: '/', label: 'HOME', exact: true },
    { href: '/auction', label: 'LIVE AUCTIONS' },
    { href: '/shop', label: 'SHOP NOW' },
    { href: '/about', label: 'ABOUT US' },
    { href: '/about#contact', label: 'CONTACT' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/8">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo.png" alt="RLG REPTILE" width={70} height={26} className="object-contain" />
        </Link>

        {/* Desktop Nav — centered */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navLinks.map(({ href, label, exact }) => {
            const base = href.split('#')[0];
            const active = exact ? pathname === base : pathname.startsWith(base) && base !== '/';
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-4 py-2 text-[11px] tracking-[0.2em] font-mono uppercase transition-colors',
                  active
                    ? 'text-white'
                    : 'text-white/35 hover:text-white'
                )}
              >
                {label}
                {active && (
                  <span className="block h-px bg-brand-red mt-0.5 mx-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 text-[10px] tracking-[0.2em] font-mono uppercase text-white/30 hover:text-white border border-white/10 hover:border-white/30 transition-all"
            >
              <Settings className="w-3 h-3 inline mr-1.5" />
              ADMIN
            </Link>
          )}
          {!loading && (
            user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="flex items-center gap-2">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={26}
                      height={26}
                      className="rounded-full ring-1 ring-white/20"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white/50" />
                    </div>
                  )}
                  <span className="text-xs text-white/40 max-w-[80px] truncate font-mono">{user.name}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-white/25 hover:text-white transition-colors"
                  aria-label="登出"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 text-[10px] tracking-[0.2em] font-mono uppercase text-white border border-brand-red hover:bg-brand-red transition-all"
              >
                LOGIN
              </Link>
            )
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="選單"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black border-t border-white/8 px-6 py-4 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-3 text-[11px] tracking-[0.3em] font-mono uppercase text-white/40 hover:text-white border-b border-white/5 transition-colors"
            >
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-3 text-[11px] tracking-[0.3em] font-mono uppercase text-white/25 hover:text-white border-b border-white/5 transition-colors"
            >
              <Settings className="w-3 h-3 mr-2" /> ADMIN
            </Link>
          )}
          <div className="pt-3">
            {!loading && (
              user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user.avatar && (
                      <Image src={user.avatar} alt={user.name} width={28} height={28} className="rounded-full" />
                    )}
                    <span className="text-xs text-white/40 font-mono">{user.name}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-[10px] text-white/25 hover:text-white font-mono uppercase tracking-widest transition-colors"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center py-3 text-[11px] tracking-[0.3em] font-mono uppercase text-white border border-brand-red"
                >
                  LOGIN
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
