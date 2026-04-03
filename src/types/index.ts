// =============================================
// Core Data Types
// =============================================

export type AuctionStatus = 'upcoming' | 'active' | 'ended';

export interface User {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  createdAt: number;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  images: string[];           // Array of image URLs
  category: string;
  startPrice: number;         // 起標價
  currentPrice: number;       // 目前最高出價
  minIncrement: number;       // 最低加價幅度
  startTime: number;          // Unix timestamp ms
  endTime: number;            // Unix timestamp ms
  status: AuctionStatus;
  sellerId: string;
  sellerName: string;
  winnerId: string | null;
  winnerName: string | null;
  lastBidderId: string | null;
  lastBidderName: string | null;
  bidCount: number;
  viewCount: number;
  createdAt: number;
  // Optional metadata
  condition?: string;         // 商品狀態：全新/二手/...
  shippingInfo?: string;
  tags?: string[];
}

export interface Bid {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  amount: number;
  timestamp: number;
  isWinning?: boolean;        // 是否為最高出價（客戶端計算）
}

// =============================================
// Form Types
// =============================================

export interface CreateAuctionForm {
  title: string;
  description: string;
  category: string;
  startPrice: number;
  minIncrement: number;
  startTime: string;          // datetime-local string
  endTime: string;
  condition: string;
  shippingInfo: string;
  images: File[];
}

// =============================================
// API Response Types
// =============================================

export interface BidResult {
  success: boolean;
  error?: string;
  newEndTime?: number;        // If auction was extended
  extended?: boolean;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================
// Notification Types
// =============================================

export interface Notification {
  id: string;
  type: 'outbid' | 'won' | 'ending_soon' | 'new_bid';
  message: string;
  auctionId: string;
  auctionTitle: string;
  timestamp: number;
  read: boolean;
}
