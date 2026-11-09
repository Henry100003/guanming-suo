"use client";
import { useState } from "react";
import { track } from "@/components/PixelEvent";

export default function CheckoutForm({ rid, price, cta, productName }: { rid: string; price: number; cta: string; productName: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      method="post"
      action="/api/checkout"
      className="mh-choices"
      onSubmit={() => { setBusy(true); track("InitiateCheckout", { value: price, currency: "TWD", content_name: productName }); }}
    >
      <input type="hidden" name="rid" value={rid} />
      <label className="mh-check">
        <input type="checkbox" name="agree" required />
        <span>
          我同意 <a href="/terms" target="_blank">服務條款</a>，並了解本報告為付款後立即提供的數位內容，
          依《通訊交易解除權合理例外情事適用準則》不適用七天猶豫期（退款方式見 <a href="/refund" target="_blank">退款政策</a>）。
        </span>
      </label>
      <button className="mh-btn" disabled={busy}>{busy ? "前往付款…" : cta}</button>
      <p className="mh-note">付款由綠界科技 ECPay 處理，本站不經手、不儲存你的卡號。</p>
    </form>
  );
}
