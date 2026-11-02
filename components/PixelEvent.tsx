"use client";
import { useEffect } from "react";

declare global { interface Window { fbq?: (...args: any[]) => void } }

export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) window.fbq("track", event, data);
}

/** 頁面載入時送出一次 Meta Pixel 事件；dedupeKey 用於避免重整頁面重複計算 Purchase */
export default function PixelEvent({ event, data, dedupeKey }: { event: string; data?: Record<string, unknown>; dedupeKey?: string }) {
  useEffect(() => {
    if (dedupeKey) {
      try {
        if (localStorage.getItem(dedupeKey)) return;
        localStorage.setItem(dedupeKey, "1");
      } catch {}
    }
    const send = () => track(event, data);
    if (window.fbq) send(); else setTimeout(send, 1500);
  }, [event, data, dedupeKey]);
  return null;
}
