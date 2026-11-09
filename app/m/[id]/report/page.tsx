import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ReportView from "@/components/ReportView";
import PixelEvent from "@/components/PixelEvent";
import Stage from "@/components/moheng/Stage";
import { getReading } from "@/lib/db";
import { PRODUCTS } from "@/lib/products";
import { MOHENG } from "@/content/moheng";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false }, title: `${MOHENG.name}｜戀愛八字詳批` };

export default async function MohengReport({ params, searchParams }: { params: { id: string }; searchParams: { paid?: string } }) {
  const r = await getReading(params.id);
  if (!r) notFound();
  if (r.product !== "moheng") redirect(`/r/${r.id}/report`);
  if (!r.paid) redirect(`/m/${r.id}#unlock`);
  const product = PRODUCTS.moheng;
  const c = r.chart;

  return (
    <div className="mh">
      <Stage bg="lantern" lantern={false}>
        <div className="mh-page">
          {searchParams.paid === "1" && (
            <PixelEvent event="Purchase" data={{ value: product.priceTwd, currency: "TWD", content_name: product.name }} dedupeKey={`purchase-${r.id}`} />
          )}
          <p className="mh-lead">墨衡・戀愛八字詳批</p>
          <p className="mh-say">給 {c.input.name}：{c.pillars.map((p) => p.gan + p.zhi).join("　")}</p>
          <ReportView id={r.id} initial={{ status: r.report_status, report: r.report }} />
          <p className="mh-note no-print">
            <Link href={product.pagePath(r.id)}>← 回到命盤</Link>　本報告為命理文化參考，不構成醫療、法律或投資建議。
          </p>
        </div>
      </Stage>
    </div>
  );
}
