import { NextResponse } from "next/server";
import { claimTeaserGeneration, getReading, updateReading } from "@/lib/db";
import { generateTeaser } from "@/lib/moheng";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET：查詢預覽狀態；POST：觸發生成（每筆命盤只會生成一次）
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const r = await getReading(params.id);
  if (!r || r.product !== "moheng") return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ status: r.teaser_status ?? "none", teaser: r.teaser ?? null });
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const r = await getReading(params.id);
  if (!r || r.product !== "moheng") return NextResponse.json({ error: "not found" }, { status: 404 });
  if (r.teaser_status === "done") return NextResponse.json({ status: "done", teaser: r.teaser });
  if (!(await claimTeaserGeneration(r.id))) return NextResponse.json({ status: "generating" });
  try {
    const teaser = await generateTeaser(r);
    await updateReading(r.id, { teaser, teaser_status: "done" });
    return NextResponse.json({ status: "done", teaser });
  } catch (e) {
    console.error("[teaser] 生成失敗", e);
    await updateReading(r.id, { teaser_status: "failed" });
    return NextResponse.json({ status: "failed" }, { status: 502 });
  }
}
