import { getOrder, markOrderPaid } from "@/lib/db";
import { ecpayEnv, readForm, verifyCheckMac } from "@/lib/ecpay";

export const dynamic = "force-dynamic";

// 綠界伺服器端付款通知（ReturnURL）。必須回應純文字 1|OK，否則綠界會重送。
export async function POST(req: Request) {
  const env = ecpayEnv();
  if (!env) return new Response("0|NotConfigured", { status: 500 });
  const p = await readForm(req);
  if (!verifyCheckMac(p, env.hashKey, env.hashIv)) {
    console.warn("[ecpay] CheckMacValue 驗證失敗", p.MerchantTradeNo);
    return new Response("0|CheckMacValueError", { status: 400 });
  }
  const order = await getOrder(p.MerchantTradeNo);
  if (!order) return new Response("0|OrderNotFound", { status: 404 });

  const simulated = p.SimulatePaid === "1";
  const isProd = process.env.ECPAY_ENV === "production";
  if (p.RtnCode === "1" && Number(p.TradeAmt) === order.amount && !(simulated && isProd)) {
    await markOrderPaid(p.MerchantTradeNo, p.PaymentType ?? "", p);
  } else {
    console.warn("[ecpay] 付款未成功或金額不符", p.MerchantTradeNo, p.RtnCode, p.RtnMsg, p.TradeAmt);
  }
  return new Response("1|OK", { headers: { "content-type": "text/plain" } });
}
