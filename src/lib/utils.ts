import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================
// Currency formatting
// =============================================

export function formatCurrency(amount: number, currency = 'TWD'): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =============================================
// Countdown formatting
// =============================================

export function formatCountdown(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;  // < 5 minutes
  isCritical: boolean; // < 60 seconds (extension zone)
  label: string;
} {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false, isCritical: false, label: '已結標' };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = ms < 5 * 60 * 1000;
  const isCritical = ms < 60 * 1000;

  let label: string;
  if (days > 0) label = `${days}天 ${hours}時 ${minutes}分`;
  else if (hours > 0) label = `${hours}:${pad(minutes)}:${pad(seconds)}`;
  else label = `${pad(minutes)}:${pad(seconds)}`;

  return { days, hours, minutes, seconds, isUrgent, isCritical, label };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// =============================================
// Date formatting
// =============================================

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  return formatDateTime(timestamp);
}

// =============================================
// Auction status helpers
// =============================================

export function getAuctionStatusLabel(status: string): string {
  switch (status) {
    case 'upcoming': return '即將開始';
    case 'active': return '競標中';
    case 'ended': return '已結標';
    default: return status;
  }
}

export function getMinBid(currentPrice: number, minIncrement: number): number {
  return currentPrice + minIncrement;
}

// =============================================
// Image upload helper
// =============================================

export function getImagePlaceholder(title: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&size=800&background=262626&color=FAFAFA&bold=true&length=2`;
}
