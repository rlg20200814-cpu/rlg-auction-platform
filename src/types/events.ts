// =============================================
// BidNow × CRM 事件模型
// 所有事件透過 /api/events 送出，n8n 接收後寫入 Google Sheets CRM
// =============================================

export type EventType =
  | 'user_registered'
  | 'user_logged_in'
  | 'auction_joined'
  | 'bid_placed'
  | 'bid_won'
  | 'order_created'
  | 'payment_confirmed'
  | 'shipment_updated'
  | 'interest_marked'
  | 'task_created';

export type SourceChannel = 'web' | 'line' | 'admin';
export type RegisterMethod = 'line' | 'google' | 'email';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type ShippingStatus = 'pending' | 'shipped' | 'delivered';
export type TaskReason = 'bid_lost' | 'unpaid' | 'interested' | 'other';

// ── 共用 Base ──────────────────────────────────────────────────────────────
export interface BaseEvent {
  event_id: string;            // crypto.randomUUID()
  event_type: EventType;
  event_time: string;          // ISO 8601
  platform: 'bidnow';
  source_channel: SourceChannel;
  platform_user_id: string;   // Firebase uid (e.g. "line:Uxxxxx")
  line_user_id?: string;       // LINE userId (without "line:" prefix)
  operator?: string;           // 管理員操作時填入
}

// ── 1. user_registered ────────────────────────────────────────────────────
export interface UserRegisteredEvent extends BaseEvent {
  event_type: 'user_registered';
  name: string;
  email: string;
  avatar: string;
  register_method: RegisterMethod;
}

// ── 2. user_logged_in ─────────────────────────────────────────────────────
export interface UserLoggedInEvent extends BaseEvent {
  event_type: 'user_logged_in';
  login_method: RegisterMethod;
  name: string;
  email: string;
}

// ── 3. auction_joined ─────────────────────────────────────────────────────
export interface AuctionJoinedEvent extends BaseEvent {
  event_type: 'auction_joined';
  auction_id: string;
  product_name: string;
  category: string;
}

// ── 4. bid_placed ─────────────────────────────────────────────────────────
export interface BidPlacedEvent extends BaseEvent {
  event_type: 'bid_placed';
  auction_id: string;
  product_name: string;
  category: string;
  bid_amount: number;
  bid_count_in_auction: number;
  is_extended: boolean;
  new_end_time: number;
}

// ── 5. bid_won ────────────────────────────────────────────────────────────
export interface BidWonEvent extends BaseEvent {
  event_type: 'bid_won';
  auction_id: string;
  product_name: string;
  category: string;
  final_price: number;
  total_bid_count: number;
  ended_at: string;            // ISO 8601
}

// ── 6. order_created ──────────────────────────────────────────────────────
export interface OrderCreatedEvent extends BaseEvent {
  event_type: 'order_created';
  order_id: string;
  auction_id: string;
  product_name: string;
  amount: number;
  payment_status: PaymentStatus;
  shipping_status: ShippingStatus;
}

// ── 7. payment_confirmed ──────────────────────────────────────────────────
export interface PaymentConfirmedEvent extends BaseEvent {
  event_type: 'payment_confirmed';
  order_id: string;
  amount: number;
  payment_method: string;
  paid_at: string;             // ISO 8601
}

// ── 8. shipment_updated ───────────────────────────────────────────────────
export interface ShipmentUpdatedEvent extends BaseEvent {
  event_type: 'shipment_updated';
  order_id: string;
  shipping_status: ShippingStatus;
  tracking_number?: string;
  carrier?: string;
}

// ── 9. interest_marked ────────────────────────────────────────────────────
export interface InterestMarkedEvent extends BaseEvent {
  event_type: 'interest_marked';
  auction_id: string;
  product_name: string;
  category: string;
}

// ── 10. task_created ──────────────────────────────────────────────────────
export interface TaskCreatedEvent extends BaseEvent {
  event_type: 'task_created';
  task_reason: TaskReason;
  auction_id?: string;
  product_name?: string;
  task_note: string;
  due_date?: string;           // YYYY-MM-DD
}

// ── Union type ─────────────────────────────────────────────────────────────
export type AnyEvent =
  | UserRegisteredEvent
  | UserLoggedInEvent
  | AuctionJoinedEvent
  | BidPlacedEvent
  | BidWonEvent
  | OrderCreatedEvent
  | PaymentConfirmedEvent
  | ShipmentUpdatedEvent
  | InterestMarkedEvent
  | TaskCreatedEvent;
