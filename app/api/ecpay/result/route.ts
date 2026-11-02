import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getOrder, markOrderPaid } from "@/lib/db";
import { ecpayEnv, readForm, verifyCheckMac } from "@/lib/ecpay";

export const dynamic = "force-dynamic";

// 付款完成後綠界把使用者瀏覽器 POST 回來（OrderResultURL），驗證後導向報告頁
export async function POST(req: Request) {
  const env = ecpayEnv();
  const p = await readForm(req);
  const order = p.MerchantTradeNo ? await getOrder(p.MerchantTradeNo) : null;
  const rid = order?.reading_id ?? p.CustomField1;
  if (!env || !rid) return NextResponse.redirect(config.siteUrl, 303);

  if (verifyCheckMac(p, env.hashKey, env.hashIv) && order && p.RtnCode === "1" && Number(p.TradeAmt) === order.amount) {
    const simulated = p.SimulatePaid === "1" && process.env.ECPAY_ENV === "production";
    if (!simulated) await markOrderPaid(order.trade_no, p.PaymentType ?? "", p);
    return NextResponse.redirect(`${config.siteUrl}/r/${rid}/report?paid=1`, 303);
  }
  return NextResponse.redirect(`${config.siteUrl}/r/${rid}?err=payment`, 303);
}
