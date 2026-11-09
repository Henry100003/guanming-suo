import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Stage from "@/components/moheng/Stage";
import TeaserView from "@/components/moheng/TeaserView";
import CheckoutForm from "@/components/moheng/CheckoutForm";
import PixelEvent from "@/components/PixelEvent";
import { getReading } from "@/lib/db";
import { PRODUCTS } from "@/lib/products";
import { MOHENG } from "@/content/moheng";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false }, title: `${MOHENG.name}｜你的戀愛八字` };

export default async function MohengReading({ params, searchParams }: { params: { id: string }; searchParams: { err?: string } }) {
  const r = await getReading(params.id);
  if (!r) notFound();
  if (r.product !== "moheng") redirect(`/r/${r.id}`);
  const c = r.chart;
  const product = PRODUCTS.moheng;
  const st = c.solarTime;

  return (
    <div className="mh">
      <Stage bg="lantern" lantern={false}>
        <div className="mh-page">
          <p className="mh-lead">{MOHENG.teaserPage.intro}</p>
          <div className="mh-pillars" style={{ ["--cols" as any]: c.pillars.length }}>
            {[...c.pillars].reverse().map((p) => (
              <div key={p.label} className={p.label === "日柱" ? "day" : ""}>
                <small>{p.label === "日柱" ? "日主" : p.ganShiShen}</small>
                <b>{p.gan}<br />{p.zhi}</b>
                <small>{p.label}</small>
              </div>
            ))}
          </div>
          <p className="mh-note">
            {c.input.name}・{c.dayMaster.gan}{c.dayMaster.element}日主・{c.strength.level}
            {st ? `・真太陽時 ${String(st.hour).padStart(2, "0")}:${String(st.minute).padStart(2, "0")}（${st.placeLabel}${st.dstMinutes ? "，已扣日光節約時間" : ""}）` : c.hourKnown ? "" : "・時辰不詳，排三柱"}
          </p>

          <TeaserView id={r.id} initial={{ status: r.teaser_status ?? "none", teaser: r.teaser ?? null }} />

          {searchParams.err === "payment" && <div className="mh-error">付款未完成，你可以再試一次。如已扣款請來信，我們會盡快處理。</div>}
          {searchParams.err === "agree" && <div className="mh-error">請先勾選同意事項再前往付款。</div>}

          {r.paid ? (
            <div className="mh-locked">
              <p className="mh-say">你已經拿走那張紙了。</p>
              <Link className="mh-btn" href={product.reportPath(r.id)}>打開完整報告</Link>
            </div>
          ) : (
            <div className="mh-locked" id="unlock">
              <p className="mh-say">「{MOHENG.teaserPage.lockedIntro}」</p>
              <ol>
                {MOHENG.reportSections.map((s) => <li key={s}>{s}</li>)}
              </ol>
              <p className="mh-blur" aria-hidden>
                你在感情裡最常犯的錯，是在對方還沒開口之前，就先替他做了決定。{c.currentYear.year + 1} 年之後……
              </p>
              <p className="mh-note">約 3,000 字・依你的命盤與你告訴他的事撰寫・可永久回看、存成 PDF</p>
              <div className="mh-price">NT${product.priceTwd} <small>單次付費，不會再推銷其他服務</small></div>
              <CheckoutForm rid={r.id} price={product.priceTwd} cta={MOHENG.teaserPage.cta} productName={product.name} />
              <PixelEvent event="ViewContent" data={{ content_name: product.name, value: product.priceTwd, currency: "TWD" }} />
            </div>
          )}
          <p className="mh-note">請收藏此頁網址，之後可以隨時回來。命理僅供參考，不構成醫療、法律或投資建議。</p>
        </div>
      </Stage>
    </div>
  );
}
