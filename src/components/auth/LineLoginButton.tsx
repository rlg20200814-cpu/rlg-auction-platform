'use client';

import { cn } from '@/lib/utils';

interface LineLoginButtonProps {
  disabled?: boolean;
  className?: string;
  label?: string;
}

/**
 * LINE Login 按鈕
 * 點擊後導向 /api/auth/line（server-side OAuth 流程）
 */
export default function LineLoginButton({
  disabled,
  className,
  label = '使用 LINE 登入',
}: LineLoginButtonProps) {
  const handleClick = () => {
    window.location.href = '/api/auth/line';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-center gap-3',
        'bg-[#06C755] hover:bg-[#05b34c] active:bg-[#04a044]',
        'text-white font-bold text-sm',
        'px-6 py-3 rounded-lg',
        'transition-all duration-150 active:scale-95',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        className
      )}
    >
      <LineIcon />
      {label}
    </button>
  );
}

function LineIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.2" />
      <path
        d="M33.4 18.6C33.4 12.5 27.4 7.6 20 7.6S6.6 12.5 6.6 18.6c0 5.4 4.8 9.9 11.3 10.8.4.1 1 .3 1.2.7.2.4.1.9.1 1.3l-.2 1.2c-.1.4-.3 1.6 1.4.9 1.7-.7 9.1-5.3 12.4-9.1h0c2.3-2.4 3.6-5 3.6-7.8z"
        fill="white"
      />
      <path
        d="M17.5 16h-1.2v4.8h1.2V16zm6.5 0H22v2.9L20.2 16H19v4.8h1.2v-2.9l1.8 2.9h1.2V16h-.2zm-9.2 3.6v-3.6h-1.2v4.8H17v-1.2h-2.2zm11.7-2.4v-1.2h-3.2v4.8h3.2v-1.2H24v-.9h2.5v-1.2H24v-.9l2.5-.4z"
        fill="#06C755"
      />
    </svg>
  );
}
