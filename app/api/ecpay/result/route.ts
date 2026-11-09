import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getOrder, getReading, markOrderPaid } from "@/lib/db";
import { productOf } from "@/lib/products";
import { ecpayEnv, readForm, verifyCheckMac } from "@/lib/ecpay";

export const dynamic = "force-dynamic";

// 付款完成後綠界把使用者瀏覽器 POST 回來（OrderResultURL），驗證後導向報告頁
export async function POST(req: Request) {
  const env = ecpayEnv();
  const p = await readForm(req);
  const order = p.MerchantTradeNo ? await getOrder(p.MerchantTradeNo) : null;
  const rid = order?.reading_id ?? p.CustomField1;
  if (!env || !rid) return NextResponse.redirect(config.siteUrl, 303);
  const product = productOf(await getReading(rid));

  if (verifyCheckMac(p, env.hashKey, env.hashIv) && order && p.RtnCode === "1" && Number(p.TradeAmt) === order.amount) {
    const simulated = p.SimulatePaid === "1" && process.env.ECPAY_ENV === "production";
    if (!simulated) await markOrderPaid(order.trade_no, p.PaymentType ?? "", p);
    return NextResponse.redirect(`${config.siteUrl}${product.reportPath(rid)}?paid=1`, 303);
  }
  return NextResponse.redirect(`${config.siteUrl}${product.pagePath(rid)}?err=payment#unlock`, 303);
}
