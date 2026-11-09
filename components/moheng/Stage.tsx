"use client";
import { useEffect, useState } from "react";
import type { Portrait, SceneBg } from "@/content/moheng";
import "./moheng.css";

/** 背景圖與立繪：public/moheng/<name>.webp 存在就顯示，不存在則用 CSS 場景 */
// 圖片存在與否的快取，避免每一幕重新探測
const exists = new Map<string, boolean>();

function OptionalImg({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(() => exists.get(src) === true);
  useEffect(() => {
    if (exists.has(src)) { setOk(exists.get(src)!); return; }
    // 先在背景載入，確定存在才顯示，避免出現破圖
    const img = new Image();
    img.onload = () => { exists.set(src, true); setOk(true); };
    img.onerror = () => { exists.set(src, false); setOk(false); };
    img.src = src;
  }, [src]);
  // eslint-disable-next-line @next/next/no-img-element
  return ok ? <img src={src} alt={alt} /> : null;
}

export default function Stage({
  bg,
  portrait,
  progress,
  onBack,
  lantern = true,
  children,
}: {
  bg: SceneBg;
  portrait?: Portrait;
  progress?: number;
  onBack?: () => void;
  /** CSS 燈籠（沒有背景圖時的氛圍）；內容頁可關掉 */
  lantern?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mh mh-stage">
      <div className={`mh-bg ${bg}`}>
        <OptionalImg src={`/moheng/${bg}.webp`} alt="" />
      </div>
      {lantern && <div className="mh-lantern" aria-hidden />}
      {portrait && (
        <div className="mh-portrait">
          <OptionalImg key={portrait} src={`/moheng/${portrait}.webp`} alt="墨衡" />
        </div>
      )}
      {progress !== undefined && <div className="mh-progress" style={{ width: `${Math.round(progress * 100)}%` }} />}
      <div className="mh-top">
        {onBack ? <button className="mh-back" onClick={onBack} aria-label="上一步">‹</button> : <span />}
        <span className="mh-brand">墨衡</span>
        <span style={{ width: 32 }} />
      </div>
      {children}
    </div>
  );
}
