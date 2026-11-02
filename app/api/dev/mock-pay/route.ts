import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { createOrder, getReading, markOrderPaid } from "@/lib/db";
import { newTradeNo } from "@/lib/ecpay";

export const dynamic = "force-dynamic";

// 開發用：未設定綠界時模擬付款成功。ALLOW_MOCK_PAY 未開啟時一律 404，正式環境務必關閉。
export async function GET(req: Request) {
  if (!config.allowMockPay) return new NextResponse("Not found", { status: 404 });
  const rid = new URL(req.url).searchParams.get("rid") ?? "";
  const r = await getReading(rid);
  if (!r) return new NextResponse("Not found", { status: 404 });
  const tradeNo = newTradeNo();
  await createOrder({ trade_no: tradeNo, reading_id: rid, amount: config.priceTwd });
  await markOrderPaid(tradeNo, "Mock", { mock: "1" });
  return NextResponse.redirect(`${config.siteUrl}/r/${rid}/report?paid=1`, 303);
}
