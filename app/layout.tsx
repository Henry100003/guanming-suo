import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${config.brandName}｜八字命盤免費排盤與詳批`,
  description: `${config.brandTagline}。輸入生日即可免費排出八字四柱、五行分布與大運，完整詳批報告一次付費、永久查看。`,
  metadataBase: new URL(config.siteUrl),
  openGraph: { title: `${config.brandName}｜八字命盤`, description: config.brandTagline, locale: "zh_TW", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {config.metaPixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${config.metaPixelId}');fbq('track','PageView');`}</Script>
        )}
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">
              <span className="seal">{config.brandName.slice(0, 1)}</span>
              {config.brandName}
            </Link>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <nav>
              <Link href="/terms">服務條款</Link>
              <Link href="/privacy">隱私權政策</Link>
              <Link href="/refund">退款政策</Link>
              <a href={`mailto:${config.contactEmail}`}>聯絡我們</a>
            </nav>
            <div>
              {config.companyName}　統一編號 {config.companyTaxId}
            </div>
            <div>命理內容僅供自我探索與生活參考，不構成醫療、法律或投資建議。</div>
            <div>本站不會主動來電或私訊要求轉帳，也不販售法會、符咒等化解服務。</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
