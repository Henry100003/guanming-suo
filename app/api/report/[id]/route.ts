import { NextResponse } from "next/server";
import { claimReportGeneration, getReading, updateReading } from "@/lib/db";
import { generateReport } from "@/lib/report";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Vercel：AI 生成約 30–60 秒

// GET：查詢報告狀態；POST：觸發生成（已付款且尚未生成時）
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const r = await getReading(params.id);
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ paid: r.paid, status: r.report_status, report: r.paid ? r.report : null });
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const r = await getReading(params.id);
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!r.paid) return NextResponse.json({ error: "尚未付款" }, { status: 402 });
  if (r.report_status === "done") return NextResponse.json({ status: "done", report: r.report });

  const claimed = await claimReportGeneration(r.id);
  if (!claimed) return NextResponse.json({ status: "generating" });
  try {
    const report = await generateReport(r.chart);
    await updateReading(r.id, { report, report_status: "done" });
    return NextResponse.json({ status: "done", report });
  } catch {
    await updateReading(r.id, { report_status: "failed" });
    return NextResponse.json({ status: "failed" }, { status: 502 });
  }
}
