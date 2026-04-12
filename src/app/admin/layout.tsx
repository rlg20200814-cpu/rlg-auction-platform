'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { LayoutGrid, Plus, Settings, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div className="text-brand-gray-500 text-sm">驗證中...</div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: '競標管理', icon: LayoutGrid, exact: true },
    { href: '/admin/auctions/new', label: '新增商品', icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-brand-black flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-brand-gray-800 p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8">
          <Image src="/logo.png" alt="RLG REPTILE" width={100} height={36} className="object-contain" />
          <span className="text-xs text-brand-gray-500 font-medium">Admin</span>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-brand-white text-brand-black'
                    : 'text-brand-gray-400 hover:text-brand-white hover:bg-brand-gray-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <Link href="/" className="flex items-center gap-2 text-sm text-brand-gray-500 hover:text-brand-gray-300 transition-colors mt-4">
          <ArrowLeft className="w-4 h-4" />
          返回前台
        </Link>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-brand-black border-b border-brand-gray-800 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="RLG REPTILE" width={70} height={26} className="object-contain" />
          <span className="text-xs text-brand-gray-500">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="btn-ghost p-2">
              <Icon className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:p-8 px-4 pt-20 md:pt-8 pb-12">
        {children}
      </main>
    </div>
  );
}
