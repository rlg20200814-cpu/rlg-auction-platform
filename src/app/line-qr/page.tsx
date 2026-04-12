import type { Metadata } from 'next';
import LineQRCode from '@/components/LineQRCode';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '加入我們',
};

/**
 * /line-qr — 公開的 QR Code 頁面
 * 可列印或投影，讓現場用戶掃碼加入
 */
export default function LineQRPage() {
  const lineOaId = process.env.NEXT_PUBLIC_LINE_OA_ID || '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <Link href="/" className="flex items-center mb-10">
        <Image src="/logo.png" alt="RLG REPTILE" width={140} height={52} className="object-contain" />
      </Link>

      <div className="w-full max-w-md space-y-6">
        {/* LINE QR */}
        {lineOaId && (
          <div>
            <h2 className="text-sm font-medium text-brand-gray-400 uppercase tracking-widest mb-3 text-center">
              加入 LINE 官方帳號
            </h2>
            <LineQRCode lineOaId={lineOaId} card />
          </div>
        )}

        {/* Site QR */}
        <div>
          <h2 className="text-sm font-medium text-brand-gray-400 uppercase tracking-widest mb-3 text-center">
            立即競標
          </h2>
          <LineQRCode siteUrl={siteUrl} card />
        </div>

        <p className="text-center text-xs text-brand-gray-700">
          掃描 QR Code 或輸入網址即可參與競標
        </p>
      </div>
    </div>
  );
}
