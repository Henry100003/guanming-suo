import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getReading, createOrder } from "@/lib/db";
import { autoSubmitForm, buildCheckoutParams, ecpayEnv, newTradeNo } from "@/lib/ecpay";

export const dynamic = "force-dynamic";

// 使用 POST：由報告頁的表單送出（含消費者同意解除權例外的勾選）
export async function POST(req: Request) {
  const fd = await req.formData();
  const rid = String(fd.get("rid") ?? "");
  const agree = fd.get("agree") === "on";
  const back = `${config.siteUrl}/r/${rid}`;
  if (!agree) return NextResponse.redirect(`${back}?err=agree`, 303);

  const reading = await getReading(rid);
  if (!reading) return NextResponse.json({ error: "找不到命盤" }, { status: 404 });
  if (reading.paid) return NextResponse.redirect(`${back}/report`, 303);

  const env = ecpayEnv();
  if (!env) {
    if (config.allowMockPay) return NextResponse.redirect(`${config.siteUrl}/api/dev/mock-pay?rid=${rid}`, 303);
    return NextResponse.json({ error: "金流尚未設定" }, { status: 500 });
  }

  const tradeNo = newTradeNo();
  await createOrder({ trade_no: tradeNo, reading_id: rid, amount: config.priceTwd });
  const params = buildCheckoutParams({
    ...env,
    tradeNo,
    amount: config.priceTwd,
    itemName: config.productName,
    tradeDesc: `${config.brandName} ${config.productName}`,
    returnUrl: `${config.siteUrl}/api/ecpay/notify`,
    orderResultUrl: `${config.siteUrl}/api/ecpay/result`,
    clientBackUrl: back,
    customField1: rid,
  });
  return new NextResponse(autoSubmitForm(env.endpoint, params), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
