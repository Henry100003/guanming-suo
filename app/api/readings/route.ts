import { NextResponse } from "next/server";
import { computeChart, parseInput } from "@/lib/bazi";
import { createReading } from "@/lib/db";

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "格式錯誤" }, { status: 400 }); }
  if (body?.consent !== true) return NextResponse.json({ error: "請先同意隱私權政策" }, { status: 400 });
  const input = parseInput(body);
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "channel"]) {
    if (typeof body?.utm?.[k] === "string") utm[k] = body.utm[k].slice(0, 120);
  }
  try {
    const chart = computeChart(input);
    const id = await createReading(input, chart, Object.keys(utm).length ? utm : null);
    return NextResponse.json({ id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "系統忙碌，請稍後再試" }, { status: 500 });
  }
}
