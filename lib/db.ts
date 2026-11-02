// 資料層：設定 Supabase 環境變數時使用 Supabase；否則用本機 JSON 檔（僅供開發測試）
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { BirthInput, Chart } from "./bazi";

export interface ReportSection { title: string; body: string }
export interface Report { sections: ReportSection[]; model: string; generatedAt: string }

export interface Reading {
  id: string;
  created_at: string;
  input: BirthInput;
  chart: Chart;
  utm: Record<string, string> | null;
  paid: boolean;
  paid_at: string | null;
  report: Report | null;
  report_status: "none" | "generating" | "done" | "failed";
  report_started_at?: string | null;
}

export interface Order {
  trade_no: string;
  reading_id: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  created_at: string;
  paid_at: string | null;
  payment_type: string | null;
  raw: Record<string, string> | null;
}

let sb: SupabaseClient | null = null;
function supa(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!sb) sb = createClient(url, key, { auth: { persistSession: false } });
  return sb;
}

// ---------- 本機 JSON 後備 ----------
const FILE = path.join(process.cwd(), ".data", "db.json");
type LocalDb = { readings: Record<string, Reading>; orders: Record<string, Order> };
async function loadLocal(): Promise<LocalDb> {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return { readings: {}, orders: {} }; }
}
async function saveLocal(db: LocalDb) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2));
}
function ensureLocalAllowed() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_DB !== "true") {
    throw new Error("正式環境必須設定 SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
  }
}

// ---------- 對外介面 ----------
export async function createReading(input: BirthInput, chart: Chart, utm: Record<string, string> | null): Promise<string> {
  const row: Reading = {
    id: crypto.randomUUID(), created_at: new Date().toISOString(), input, chart, utm,
    paid: false, paid_at: null, report: null, report_status: "none", report_started_at: null,
  };
  const s = supa();
  if (s) {
    const { error } = await s.from("readings").insert(row);
    if (error) throw error;
  } else {
    ensureLocalAllowed();
    const db = await loadLocal(); db.readings[row.id] = row; await saveLocal(db);
  }
  return row.id;
}

export async function getReading(id: string): Promise<Reading | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const s = supa();
  if (s) {
    const { data, error } = await s.from("readings").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Reading | null;
  }
  ensureLocalAllowed();
  return (await loadLocal()).readings[id] ?? null;
}

export async function updateReading(id: string, patch: Partial<Reading>) {
  const s = supa();
  if (s) {
    const { error } = await s.from("readings").update(patch).eq("id", id);
    if (error) throw error;
    return;
  }
  ensureLocalAllowed();
  const db = await loadLocal();
  if (db.readings[id]) { db.readings[id] = { ...db.readings[id], ...patch }; await saveLocal(db); }
}

/** 搶佔報告生成權，避免重複呼叫 AI；卡在 generating 超過 5 分鐘（例如函式逾時）可重新搶佔 */
export async function claimReportGeneration(id: string): Promise<boolean> {
  const now = new Date();
  const stale = new Date(now.getTime() - 5 * 60_000).toISOString();
  const s = supa();
  if (s) {
    const { data, error } = await s.from("readings")
      .update({ report_status: "generating", report_started_at: now.toISOString() })
      .eq("id", id).eq("paid", true)
      .or(`report_status.in.(none,failed),and(report_status.eq.generating,report_started_at.lt.${stale})`)
      .select("id");
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }
  const db = await loadLocal();
  const r = db.readings[id];
  if (!r || !r.paid || r.report_status === "done") return false;
  if (r.report_status === "generating" && (r.report_started_at ?? "") > stale) return false;
  r.report_status = "generating"; r.report_started_at = now.toISOString(); await saveLocal(db); return true;
}

export async function createOrder(o: Omit<Order, "created_at" | "paid_at" | "payment_type" | "raw" | "status">) {
  const row: Order = { ...o, status: "pending", created_at: new Date().toISOString(), paid_at: null, payment_type: null, raw: null };
  const s = supa();
  if (s) {
    const { error } = await s.from("orders").insert(row);
    if (error) throw error;
    return row;
  }
  ensureLocalAllowed();
  const db = await loadLocal(); db.orders[row.trade_no] = row; await saveLocal(db);
  return row;
}

export async function getOrder(tradeNo: string): Promise<Order | null> {
  const s = supa();
  if (s) {
    const { data, error } = await s.from("orders").select("*").eq("trade_no", tradeNo).maybeSingle();
    if (error) throw error;
    return data as Order | null;
  }
  return (await loadLocal()).orders[tradeNo] ?? null;
}

/** 標記訂單付款成功並解鎖報告（可重複呼叫，具冪等性） */
export async function markOrderPaid(tradeNo: string, paymentType: string, raw: Record<string, string>) {
  const order = await getOrder(tradeNo);
  if (!order) throw new Error("order not found");
  if (order.status === "paid") return order;
  const now = new Date().toISOString();
  const s = supa();
  if (s) {
    const { error } = await s.from("orders").update({ status: "paid", paid_at: now, payment_type: paymentType, raw }).eq("trade_no", tradeNo);
    if (error) throw error;
    await updateReading(order.reading_id, { paid: true, paid_at: now });
  } else {
    const db = await loadLocal();
    db.orders[tradeNo] = { ...order, status: "paid", paid_at: now, payment_type: paymentType, raw };
    const r = db.readings[order.reading_id];
    if (r) { r.paid = true; r.paid_at = now; }
    await saveLocal(db);
  }
  return order;
}
