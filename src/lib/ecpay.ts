import crypto from 'crypto';

/**
 * 綠界 ECPay 金流工具
 * 文件：https://developers.ecpay.com.tw/
 */

// ECPay 特殊的 URL encode（模擬 .NET HttpUtility.UrlEncode）
function urlEncodeECPay(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/%21/g, '!')
    .replace(/%27/g, "'")
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%2A/g, '*')
    .replace(/%7E/g, '~');
}

/** 計算 CheckMacValue（SHA256） */
export function generateCheckMacValue(
  params: Record<string, string | number>,
  hashKey: string,
  hashIV: string
): string {
  const sorted = Object.keys(params)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = urlEncodeECPay(raw).toLowerCase();
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

/** 驗證 ECPay 回傳的 CheckMacValue */
export function verifyCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
): boolean {
  const { CheckMacValue, ...rest } = params;
  if (!CheckMacValue) return false;
  const expected = generateCheckMacValue(rest, hashKey, hashIV);
  return expected === CheckMacValue.toUpperCase();
}

export interface ECPayFormParams {
  merchantId: string;
  merchantTradeNo: string;   // 訂單編號 max 20 chars, alphanumeric
  tradeDesc: string;
  itemName: string;          // 商品名稱，多項用 # 分隔
  totalAmount: number;       // 整數
  returnUrl: string;         // Server 端通知 URL（必須可公開存取）
  orderResultUrl: string;    // 付款完成後跳轉 URL
  hashKey: string;
  hashIV: string;
  isTest?: boolean;
}

/** 產生送往 ECPay 的表單欄位 */
export function buildECPayForm(p: ECPayFormParams): {
  action: string;
  fields: Record<string, string>;
} {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const merchantTradeDate =
    `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const params: Record<string, string | number> = {
    MerchantID: p.merchantId,
    MerchantTradeNo: p.merchantTradeNo,
    MerchantTradeDate: merchantTradeDate,
    PaymentType: 'aio',
    TotalAmount: Math.round(p.totalAmount),
    TradeDesc: p.tradeDesc,
    ItemName: p.itemName,
    ReturnURL: p.returnUrl,
    OrderResultURL: p.orderResultUrl,
    ChoosePayment: 'Credit',
    EncryptType: 1,
  };

  const checkMacValue = generateCheckMacValue(params, p.hashKey, p.hashIV);

  const action = p.isTest
    ? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
    : 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';

  return {
    action,
    fields: {
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      CheckMacValue: checkMacValue,
    },
  };
}
