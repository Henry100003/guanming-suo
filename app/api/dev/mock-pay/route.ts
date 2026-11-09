import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { createOrder, getReading, markOrderPaid } from "@/lib/db";
import { newTradeNo } from "@/lib/ecpay";
import { productOf } from "@/lib/products";

export const dynamic = "force-dynamic";

// 開發用：未設定綠界時模擬付款成功。ALLOW_MOCK_PAY 未開啟時一律 404，正式環境務必關閉。
export async function GET(req: Request) {
  if (!config.allowMockPay) return new NextResponse("Not found", { status: 404 });
  const rid = new URL(req.url).searchParams.get("rid") ?? "";
  const r = await getReading(rid);
  if (!r) return new NextResponse("Not found", { status: 404 });
  const tradeNo = newTradeNo();
  const product = productOf(r);
  await createOrder({ trade_no: tradeNo, reading_id: rid, amount: product.priceTwd });
  await markOrderPaid(tradeNo, "Mock", { mock: "1" });
  return NextResponse.redirect(`${config.siteUrl}${product.reportPath(rid)}?paid=1`, 303);
}
