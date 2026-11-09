import { NextResponse } from "next/server";
import { computeChart } from "@/lib/bazi";
import { createReading } from "@/lib/db";
import { parseMohengInput } from "@/lib/moheng";

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "格式錯誤" }, { status: 400 }); }
  if (body?.consent !== true) return NextResponse.json({ error: "請先同意隱私權政策" }, { status: 400 });
  const parsed = parseMohengInput(body);
  if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });

  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "channel", "fbclid"]) {
    if (typeof body?.utm?.[k] === "string") utm[k] = body.utm[k].slice(0, 200);
  }
  try {
    const chart = computeChart(parsed.birth);
    const id = await createReading(parsed.birth, chart, Object.keys(utm).length ? utm : null, {
      product: "moheng",
      context: parsed.context,
      email: parsed.email,
    });
    return NextResponse.json({ id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "系統忙碌，請稍後再試" }, { status: 500 });
  }
}
