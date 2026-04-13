/**
 * scoring — 客戶分級與分數計算
 */

export type CustomerLevel = '新客' | '已互動客' | '競標客' | '高價值客';

interface ScoreInput {
  total_bid_count: number;
  total_win_count: number;
  total_spend: number;
}

export function calcScore(input: ScoreInput): number {
  return input.total_bid_count * 2 + input.total_win_count * 10 + Math.floor(input.total_spend / 1000);
}

export function calcLevel(input: ScoreInput): CustomerLevel {
  if (input.total_bid_count === 0) return '新客';
  if (input.total_win_count === 0) return '已互動客';
  if (input.total_spend < 10000) return '競標客';
  return '高價值客';
}
