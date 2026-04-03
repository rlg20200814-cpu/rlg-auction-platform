# BidNow — 即時競標平台

商業化即時競標平台，支援手機與桌機，以高轉換率為設計核心。

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js 14 (App Router) |
| 樣式 | Tailwind CSS（黑白極簡設計）|
| 即時功能 | Firebase Realtime Database (WebSocket) |
| 身份驗證 | Firebase Auth (Email + Google) |
| 圖片儲存 | Firebase Storage |
| 部署 | Vercel |
| 語言 | TypeScript |

## 核心功能

- **即時出價**：Firebase Realtime Database WebSocket，毫秒同步
- **Transaction 防競爭**：`runTransaction()` 確保高併發出價正確性
- **延長機制**：結標前 60 秒出價 → 自動延長 60 秒（可重複）
- **防重複出價**：Transaction 中檢查 `lastBidderId`
- **Admin 後台**：新增/編輯/開始/結束競標
- **Webhook 預留**：出價事件可發送到 n8n/LINE Bot

---

## 快速開始

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 新增專案（關閉 Google Analytics 可加速）
3. 啟用以下服務：
   - **Authentication** → Sign-in method → 啟用 Email/Password 和 Google
   - **Realtime Database** → 建立資料庫（選 asia-east1 台灣最近）
   - **Storage** → 開始使用

### 2. 設定環境變數

```bash
cp .env.local.example .env.local
```

編輯 `.env.local`，填入 Firebase Console > 專案設定 > 應用程式設定中的值。

### 3. 設定 Firebase Security Rules

**Realtime Database Rules**（在 Firebase Console > Realtime Database > Rules）：
```json
// 複製 database.rules.json 的內容貼上
```

**Storage Rules**（在 Firebase Console > Storage > Rules）：
```
// 複製 storage.rules 的內容貼上
```

### 4. 設定管理員帳號

1. 先用 Google 或 Email 登入網站建立帳號
2. 到 Firebase Console > Authentication > Users，複製你的 **UID**
3. 在 `.env.local` 中設定：
   ```
   NEXT_PUBLIC_ADMIN_UIDS=你的UID
   ```
   多個管理員用逗號分隔：`uid1,uid2,uid3`

### 5. 安裝並啟動

```bash
cd auction-platform
npm install
npm run dev
```

開啟 http://localhost:3000

---

## 部署到 Vercel

```bash
# 安裝 Vercel CLI（如未安裝）
npm i -g vercel

# 部署
vercel
```

或直接連接 GitHub repo，在 Vercel Dashboard 設定環境變數（同 .env.local 內容）。

### Vercel 環境變數設定

在 Vercel Dashboard > Settings > Environment Variables 逐一新增所有 `NEXT_PUBLIC_` 開頭的變數。

---

## 資料庫結構

```
Firebase Realtime Database
├── users/
│   └── {uid}/
│       ├── uid: string
│       ├── name: string
│       ├── email: string
│       ├── avatar: string (URL)
│       ├── isAdmin: boolean
│       └── createdAt: number (timestamp ms)
│
├── auctions/
│   └── {auctionId}/
│       ├── title: string
│       ├── description: string
│       ├── category: string
│       ├── condition: string
│       ├── images: string[] (URLs)
│       ├── startPrice: number
│       ├── currentPrice: number        ← 即時更新
│       ├── minIncrement: number
│       ├── startTime: number
│       ├── endTime: number             ← 延長時更新
│       ├── status: 'upcoming'|'active'|'ended'
│       ├── bidCount: number            ← 即時更新
│       ├── lastBidderId: string|null
│       ├── lastBidderName: string|null
│       ├── winnerId: string|null
│       ├── winnerName: string|null
│       ├── viewCount: number
│       └── createdAt: number
│
└── bids/
    └── {auctionId}/
        └── {bidId}/
            ├── userId: string
            ├── userName: string
            ├── userAvatar: string
            ├── amount: number
            └── timestamp: number
```

---

## 即時競標技術說明

### 防競爭條件（Race Condition）

使用 Firebase `runTransaction()` 原子操作：

```typescript
await runTransaction(auctionRef, (currentAuction) => {
  // 驗證：競標必須是 active
  if (currentAuction.status !== 'active') return undefined; // abort

  // 驗證：出價必須符合最低加價
  if (bidAmount < minRequired) return undefined;

  // 驗證：不能是同一人連續出價
  if (currentAuction.lastBidderId === userId) return undefined;

  // 延長機制：結標前 60 秒延長
  if (currentAuction.endTime - now < 60_000) {
    currentAuction.endTime = now + 60_000;
  }

  // 原子更新
  return { ...currentAuction, currentPrice: bidAmount, ... };
});
```

### 即時同步

```typescript
// 所有連線的客戶端即時接收更新（WebSocket）
onValue(ref(db, `auctions/${id}`), (snapshot) => {
  setAuction(snapshot.val());
});
```

---

## LINE Bot 串接（預留）

出價後自動呼叫 Webhook：

```env
NEXT_PUBLIC_WEBHOOK_URL=https://your-n8n.com/webhook/bid
```

Webhook payload：
```json
{
  "event": "new_bid",
  "auctionId": "xxx",
  "userId": "uid",
  "userName": "用戶名",
  "amount": 5000,
  "timestamp": 1717000000000
}
```

可在 n8n 中接收並發送 LINE 訊息通知所有關注者。

---

## 高併發處理

| 問題 | 解法 |
|------|------|
| 多人同時出價 | Firebase Transaction（CAS 操作）|
| 網路延遲導致重複出價 | Submit 按鈕 loading 狀態 + 後端 Transaction |
| 同一用戶連續出價 | Transaction 中檢查 lastBidderId |
| 時間不同步 | 以 Firebase Server Timestamp 為準 |
| 延長時間衝突 | 延長邏輯在 Transaction 中原子執行 |

---

## 目錄結構

```
auction-platform/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 根 Layout
│   │   ├── page.tsx                # 首頁（競標列表）
│   │   ├── not-found.tsx
│   │   ├── globals.css
│   │   ├── login/page.tsx          # 登入/註冊
│   │   ├── profile/page.tsx        # 個人頁
│   │   ├── auction/[id]/page.tsx   # 競標詳細頁
│   │   ├── admin/
│   │   │   ├── layout.tsx          # Admin Layout（含權限守衛）
│   │   │   ├── page.tsx            # 競標管理列表
│   │   │   └── auctions/
│   │   │       ├── new/page.tsx    # 新增商品
│   │   │       └── [id]/edit/page.tsx  # 編輯商品
│   │   └── api/
│   │       └── bids/route.ts       # Bid API endpoint
│   ├── components/
│   │   ├── layout/Header.tsx
│   │   └── auction/
│   │       ├── AuctionCard.tsx     # 競標卡片
│   │       ├── BidForm.tsx         # 出價表單（核心）
│   │       ├── BidHistory.tsx      # 即時出價紀錄
│   │       └── Countdown.tsx       # 倒數計時器
│   ├── contexts/AuthContext.tsx    # Auth 全域狀態
│   ├── hooks/
│   │   ├── useAuction.ts           # 即時競標資料
│   │   ├── useBids.ts              # 即時出價紀錄
│   │   └── useCountdown.ts         # 倒數計時邏輯
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   ├── auctions.ts
│   │   │   └── bids.ts
│   │   └── utils.ts
│   └── types/index.ts
├── database.rules.json             # Firebase RTDB 安全規則
├── storage.rules                   # Firebase Storage 安全規則
├── .env.local.example
└── README.md
```
