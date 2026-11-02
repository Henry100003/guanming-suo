import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ReportView from "@/components/ReportView";
import PixelEvent from "@/components/PixelEvent";
import { getReading } from "@/lib/db";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function ReportPage({ params, searchParams }: { params: { id: string }; searchParams: { paid?: string } }) {
  const r = await getReading(params.id);
  if (!r) notFound();
  if (!r.paid) redirect(`/r/${r.id}#unlock`);
  const c = r.chart;

  return (
    <>
      <div style={{ height: 16 }} />
      {searchParams.paid === "1" && (
        <PixelEvent event="Purchase" data={{ value: config.priceTwd, currency: "TWD", content_name: config.productName }} dedupeKey={`purchase-${r.id}`} />
      )}
      <div className="card accent">
        <div className="eyebrow">八字詳批報告</div>
        <h1 style={{ fontSize: "1.7rem" }}>{c.input.name}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {c.pillars.map((p) => `${p.gan}${p.zhi}`).join("　")}　・　日主 {c.dayMaster.gan}{c.dayMaster.element}　・　{c.strength.level}
        </p>
      </div>
      <ReportView id={r.id} initial={{ status: r.report_status, report: r.report }} />
      <p className="muted no-print">
        <Link href={`/r/${r.id}`}>← 回到命盤</Link>　本報告為命理文化參考，不構成醫療、法律或投資建議。
      </p>
    </>
  );
}
