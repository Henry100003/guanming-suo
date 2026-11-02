import { notFound } from "next/navigation";
import Link from "next/link";
import ChartView from "@/components/ChartView";
import PixelEvent from "@/components/PixelEvent";
import { getReading } from "@/lib/db";
import { extractFeatures } from "@/lib/features";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function ReadingPage({ params, searchParams }: { params: { id: string }; searchParams: { err?: string } }) {
  const r = await getReading(params.id);
  if (!r) notFound();
  const c = r.chart;
  const f = extractFeatures(c);

  return (
    <>
      <div style={{ height: 16 }} />
      {searchParams.err === "payment" && <div className="error">付款未完成，你可以再試一次。如已扣款請來信，我們會盡快處理。</div>}
      {searchParams.err === "agree" && <div className="error">請先勾選同意事項再前往付款。</div>}

      <ChartView chart={c} />

      <div className="card">
        <h2>日主解讀：{f.dayMaster.image}</h2>
        <p>{f.dayMaster.traits}</p>
        <p>{f.strengthNote}</p>
        <p className="muted">命盤中較突出的特質：{f.dominant.map((d) => `${d.group}（${d.text.strong}）`).join("；")}</p>
      </div>

      <div className="card">
        <h2>{c.currentYear.year} 流年主題</h2>
        <p>今年是 <b>{c.currentYear.ganZhi}</b> 年，對你而言是「{c.currentYear.ganShiShen}」之年：{f.yearTheme}。</p>
      </div>

      {r.paid ? (
        <div className="card accent">
          <h2>你已解鎖完整詳批</h2>
          <Link className="btn" href={`/r/${r.id}/report`}>查看詳批報告</Link>
        </div>
      ) : (
        <div className="card accent locked" id="unlock">
          <h2>完整八字詳批報告</h2>
          <p className="blur" aria-hidden>
            你的事業發展與命盤中的官殺、財星結構息息相關，未來十年的大運會讓你在……人際與感情方面，你的日主特質使你在關係中……
          </p>
          <ul className="check-list">
            <li>約 3,000 字、八個章節的個人化解讀</li>
            <li>性格天賦、事業財運、感情人際、身心節奏</li>
            <li>每步大運走勢與 {c.currentYear.year} 流年重點</li>
            <li>依喜用五行整理的具體行動建議</li>
            <li>一次付費，永久回看；不會再推銷其他服務</li>
          </ul>
          <div className="price">NT${config.priceTwd} <small>單次付費</small></div>
          <form method="post" action="/api/checkout" className="form" style={{ marginTop: 12 }}>
            <input type="hidden" name="rid" value={r.id} />
            <label className="check">
              <input type="checkbox" name="agree" required />
              <span>
                我同意 <a href="/terms" target="_blank">服務條款</a>，並了解本報告為付款後立即提供的數位內容，
                依《通訊交易解除權合理例外情事適用準則》不適用七天猶豫期（退款方式見 <a href="/refund" target="_blank">退款政策</a>）。
              </span>
            </label>
            <button className="btn">前往付款（信用卡）</button>
          </form>
          <p className="muted">付款由綠界科技 ECPay 處理，本站不經手、不儲存你的卡號。</p>
          <PixelEvent event="ViewContent" data={{ content_name: config.productName, value: config.priceTwd, currency: "TWD" }} />
        </div>
      )}
      <p className="muted">請收藏此頁網址，之後可以隨時回來查看你的命盤{r.paid ? "與報告" : ""}。</p>
    </>
  );
}
