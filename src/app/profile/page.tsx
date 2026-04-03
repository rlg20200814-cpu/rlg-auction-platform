'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { getAllAuctions } from '@/lib/firebase/auctions';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Trophy, TrendingUp, Clock, ArrowLeft } from 'lucide-react';
import type { Auction } from '@/types';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getAllAuctions().then((all) => {
      // Auctions where user has bid (won or participated)
      const relevant = all.filter((a) => a.lastBidderId === user.uid || a.winnerId === user.uid);
      setAuctions(relevant);
    });
  }, [user]);

  if (loading || !user) return null;

  const won = auctions.filter((a) => a.winnerId === user.uid);
  const active = auctions.filter((a) => a.lastBidderId === user.uid && a.status === 'active');

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-brand-gray-500 hover:text-brand-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>

        {/* Profile card */}
        <div className="card p-6 flex items-center gap-4">
          {user.avatar && (
            <Image src={user.avatar} alt={user.name} width={64} height={64} className="rounded-full ring-2 ring-brand-gray-700" />
          )}
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-brand-gray-500">{user.email}</p>
            {user.isAdmin && (
              <span className="badge bg-brand-accent/10 text-brand-accent border border-brand-accent/20 mt-1">管理員</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '參與競標', value: auctions.length, icon: TrendingUp },
            { label: '領先中', value: active.length, icon: Clock },
            { label: '已得標', value: won.length, icon: Trophy },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-4 text-center">
              <Icon className="w-4 h-4 mx-auto mb-2 text-brand-gray-400" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-brand-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Auction history */}
        {won.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-brand-gray-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              得標紀錄
            </h2>
            {won.map((a) => (
              <Link key={a.id} href={`/auction/${a.id}`} className="card p-4 flex items-center justify-between hover:border-brand-gray-600 transition-colors block">
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-brand-gray-500">{formatDateTime(a.endTime)}</p>
                </div>
                <p className="price-display text-brand-accent">{formatCurrency(a.currentPrice)}</p>
              </Link>
            ))}
          </div>
        )}

        {active.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-brand-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              進行中（你領先）
            </h2>
            {active.map((a) => (
              <Link key={a.id} href={`/auction/${a.id}`} className="card p-4 flex items-center justify-between hover:border-brand-gray-600 transition-colors block">
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-green-400">目前最高出價</p>
                </div>
                <p className="price-display text-brand-accent">{formatCurrency(a.currentPrice)}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
