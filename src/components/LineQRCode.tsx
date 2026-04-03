'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Download, Share2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LineQRCodeProps {
  /** LINE 官方帳號 ID，例如 @rlgbid */
  lineOaId?: string;
  /** 競標網站 URL */
  siteUrl?: string;
  /** 是否顯示為卡片樣式 */
  card?: boolean;
}

type QRType = 'line' | 'site';

export default function LineQRCode({ lineOaId, siteUrl, card = true }: LineQRCodeProps) {
  const [active, setActive] = useState<QRType>(lineOaId ? 'line' : 'site');

  const lineUrl = lineOaId
    ? `https://line.me/R/ti/p/${lineOaId.startsWith('@') ? lineOaId : '@' + lineOaId}`
    : null;

  const currentUrl = active === 'line' ? lineUrl : siteUrl;

  const handleShare = async () => {
    if (!currentUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: active === 'line' ? '加入 LINE 官方帳號' : '即時競標平台',
          url: currentUrl,
        });
      } else {
        await navigator.clipboard.writeText(currentUrl);
        toast.success('連結已複製到剪貼簿');
      }
    } catch {}
  };

  const handleDownload = () => {
    const svg = document.getElementById('auction-qrcode');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 400, 400);
      const link = document.createElement('a');
      link.download = `qrcode-${active}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  if (!lineUrl && !siteUrl) return null;

  return (
    <div className={cn(card && 'card p-6', 'space-y-4')}>
      {/* Type switcher */}
      {lineUrl && siteUrl && (
        <div className="flex bg-brand-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActive('line')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-md transition-all',
              active === 'line' ? 'bg-[#06C755] text-white' : 'text-brand-gray-400'
            )}
          >
            LINE 加入
          </button>
          <button
            onClick={() => setActive('site')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-md transition-all',
              active === 'site' ? 'bg-brand-white text-brand-black' : 'text-brand-gray-400'
            )}
          >
            競標網站
          </button>
        </div>
      )}

      {/* QR Code */}
      {currentUrl && (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <QRCode
              id="auction-qrcode"
              value={currentUrl}
              size={200}
              level="M"
              style={{ display: 'block' }}
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              {active === 'line' ? '掃描加入 LINE 官方帳號' : '掃描進入競標平台'}
            </p>
            <p className="text-xs text-brand-gray-500 font-mono break-all max-w-[240px] mx-auto">
              {currentUrl}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={handleShare} className="btn-secondary gap-2 text-sm py-2">
              <Share2 className="w-4 h-4" />
              分享
            </button>
            <button onClick={handleDownload} className="btn-secondary gap-2 text-sm py-2">
              <Download className="w-4 h-4" />
              下載
            </button>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary gap-2 text-sm py-2 inline-flex items-center"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
