// 綠界 ECPay 全方位金流（AIO）
import crypto from "crypto";

const STAGE = "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";
const PROD = "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5";

export function ecpayEnv() {
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIv = process.env.ECPAY_HASH_IV;
  if (!merchantId || !hashKey || !hashIv) return null;
  return {
    merchantId, hashKey, hashIv,
    endpoint: process.env.ECPAY_ENV === "production" ? PROD : STAGE,
  };
}

/** 模擬 PHP urlencode（空白轉 +），再還原綠界規定的 - _ . ! * ( ) */
function ecpayUrlEncode(s: string) {
  return encodeURIComponent(s)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7e")
    .replace(/'/g, "%27");
}

export function checkMacValue(params: Record<string, string | number>, hashKey: string, hashIv: string) {
  const keys = Object.keys(params)
    .filter((k) => k !== "CheckMacValue")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase(), "en"));
  const raw = `HashKey=${hashKey}&` + keys.map((k) => `${k}=${params[k]}`).join("&") + `&HashIV=${hashIv}`;
  const encoded = ecpayUrlEncode(raw).toLowerCase();
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

export function verifyCheckMac(params: Record<string, string>, hashKey: string, hashIv: string) {
  const got = params.CheckMacValue;
  if (!got) return false;
  const expected = checkMacValue(params, hashKey, hashIv);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/** 綠界要求的時間格式 yyyy/MM/dd HH:mm:ss（台灣時間） */
export function ecpayDate(d = new Date()) {
  const tw = new Date(d.getTime() + 8 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${tw.getUTCFullYear()}/${p(tw.getUTCMonth() + 1)}/${p(tw.getUTCDate())} ${p(tw.getUTCHours())}:${p(tw.getUTCMinutes())}:${p(tw.getUTCSeconds())}`;
}

/** 20 碼以內英數唯一訂單編號 */
export function newTradeNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `MX${ts}${rnd}`.slice(0, 20);
}

export function buildCheckoutParams(opts: {
  merchantId: string; hashKey: string; hashIv: string;
  tradeNo: string; amount: number; itemName: string; tradeDesc: string;
  returnUrl: string; orderResultUrl: string; clientBackUrl: string; customField1?: string;
}) {
  const params: Record<string, string | number> = {
    MerchantID: opts.merchantId,
    MerchantTradeNo: opts.tradeNo,
    MerchantTradeDate: ecpayDate(),
    PaymentType: "aio",
    TotalAmount: opts.amount,
    TradeDesc: opts.tradeDesc,
    ItemName: opts.itemName,
    ReturnURL: opts.returnUrl,
    OrderResultURL: opts.orderResultUrl,
    ClientBackURL: opts.clientBackUrl,
    ChoosePayment: "Credit", // 數位內容建議僅收信用卡，避免 ATM/超商延遲付款
    EncryptType: 1,
    NeedExtraPaidInfo: "N",
    CustomField1: opts.customField1 ?? "",
  };
  params.CheckMacValue = checkMacValue(params, opts.hashKey, opts.hashIv);
  return params;
}

export function autoSubmitForm(endpoint: string, params: Record<string, string | number>) {
  const esc = (v: string | number) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const inputs = Object.entries(params).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join("");
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>前往付款…</title></head>
<body style="font-family:sans-serif;text-align:center;padding:4rem 1rem;color:#333">
<p>正在前往綠界安全付款頁面…</p>
<form id="f" method="post" action="${esc(endpoint)}">${inputs}<noscript><button type="submit">前往付款</button></noscript></form>
<script>document.getElementById('f').submit()</script></body></html>`;
}

/** 解析綠界 POST 回來的 x-www-form-urlencoded */
export async function readForm(req: Request): Promise<Record<string, string>> {
  const fd = await req.formData();
  const out: Record<string, string> = {};
  fd.forEach((v, k) => (out[k] = String(v)));
  return out;
}
