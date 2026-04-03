'use client';

import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import { Clock, Zap } from 'lucide-react';

interface CountdownProps {
  endTime: number;
  onExpire?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showExtendedBadge?: boolean;
  wasExtended?: boolean;
}

export default function Countdown({
  endTime,
  onExpire,
  size = 'md',
  showExtendedBadge = false,
  wasExtended = false,
}: CountdownProps) {
  const { label, isUrgent, isCritical, days, hours, minutes, seconds } = useCountdown(endTime, onExpire);

  if (size === 'lg') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-brand-gray-400 text-xs font-medium uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5" />
          <span>結標倒數</span>
          {wasExtended && (
            <span className="flex items-center gap-1 text-brand-accent text-[10px] bg-brand-accent/10 border border-brand-accent/30 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" />
              延長中
            </span>
          )}
        </div>

        {/* Large digit display */}
        <div className={cn(
          'flex items-end gap-1 font-mono font-bold tabular-nums transition-colors duration-300',
          isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-brand-white'
        )}>
          {days > 0 && (
            <>
              <DigitBlock value={days} label="天" highlight={isCritical} />
              <DigitBlock value={hours} label="時" highlight={isCritical} />
            </>
          )}
          {days === 0 && hours > 0 && (
            <>
              <DigitBlock value={hours} label="時" highlight={isCritical} />
              <DigitBlock value={minutes} label="分" highlight={isCritical} />
            </>
          )}
          {days === 0 && hours === 0 && (
            <>
              <DigitBlock value={minutes} label="分" highlight={isCritical} />
              <DigitBlock value={seconds} label="秒" highlight={isCritical} isLast />
            </>
          )}
        </div>

        {isCritical && (
          <p className="text-red-400 text-xs animate-pulse">⚡ 結標前出價將自動延長 60 秒</p>
        )}
      </div>
    );
  }

  // sm / md
  return (
    <div className={cn(
      'flex items-center gap-1.5 font-mono font-bold tabular-nums',
      size === 'md' ? 'text-base' : 'text-sm',
      isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-brand-gray-300'
    )}>
      <Clock className={cn('shrink-0', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      <span className={isCritical ? 'animate-pulse' : ''}>{label}</span>
      {wasExtended && <Zap className="w-3.5 h-3.5 text-brand-accent" />}
    </div>
  );
}

function DigitBlock({ value, label, highlight, isLast }: {
  value: number;
  label: string;
  highlight: boolean;
  isLast?: boolean;
}) {
  const str = value.toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        'text-3xl md:text-5xl leading-none font-bold',
        highlight ? 'animate-pulse' : ''
      )}>
        {str}
      </div>
      <span className="text-[10px] text-brand-gray-500 mt-1">{label}</span>
    </div>
  );
}
