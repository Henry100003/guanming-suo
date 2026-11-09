// 墨衡（戀愛八字）：輸入解析、免費預覽與付費報告的 AI 生成
import Anthropic from "@anthropic-ai/sdk";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Lunar } = require("lunar-javascript");
import { MOHENG, RELATIONSHIP_LABEL, WORK_LABEL } from "@/content/moheng";
import { parseInput, type BirthInput, type Chart } from "./bazi";
import { extractFeatures } from "./features";
import { loveProfile } from "./love";
import { findPlace } from "./solarTime";
import type { Reading, ReadingContext, Report, ReportSection, Teaser } from "./db";

// ---------- 輸入 ----------
export interface MohengInput { birth: BirthInput; context: ReadingContext; email: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function parseMohengInput(body: any): MohengInput | string {
  let { year, month, day } = body ?? {};
  const calendar = body?.calendar === "lunar" ? "lunar" : "solar";
  if (calendar === "lunar") {
    try {
      const m = Number(month);
      const solar = Lunar.fromYmd(Number(year), body?.leapMonth ? -m : m, Number(day)).getSolar();
      year = solar.getYear(); month = solar.getMonth(); day = solar.getDay();
    } catch {
      return "農曆日期不正確（請確認是否為閏月）";
    }
  }
  const birth = parseInput({ ...body, year, month, day });
  if (typeof birth === "string") return birth;
  if (body?.place && findPlace(body.place)) birth.place = body.place;

  const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 120);
  if (!EMAIL_RE.test(email)) return "請填寫正確的電子信箱";

  const pick = (v: unknown, table: Record<string, string>) => (typeof v === "string" && v in table ? v : undefined);
  const context: ReadingContext = {
    relationship: pick(body?.relationship, RELATIONSHIP_LABEL),
    work: pick(body?.work, WORK_LABEL),
    concern: typeof body?.concern === "string" ? body.concern.trim().slice(0, 200) || undefined : undefined,
    calendar,
    marketingOptIn: body?.marketingOptIn === true,
  };
  return { birth, context, email };
}

// ---------- 給 AI 的命盤摘要 ----------
function brief(c: Chart, ctx: ReadingContext | null | undefined): string {
  const f = extractFeatures(c);
  const love = loveProfile(c);
  const st = c.solarTime;
  return `稱呼：${c.input.name}　性別：${c.input.gender === "male" ? "男" : "女"}
國曆生日：${c.input.year}/${c.input.month}/${c.input.day} ${c.hourKnown ? `${c.input.hour}:${String(c.input.minute).padStart(2, "0")}` : "（時辰不詳，只排三柱）"}
${st ? `真太陽時：${st.hour}:${String(st.minute).padStart(2, "0")}（出生地 ${st.placeLabel}，校正 ${st.totalMinutes} 分鐘）` : ""}
四柱：${c.pillars.map((p) => `${p.label} ${p.gan}${p.zhi}（${p.ganShiShen}；藏干 ${p.hideGan.map((h) => h.gan + h.shiShen).join("、")}）`).join("；")}
日主：${c.dayMaster.gan}${c.dayMaster.element}（${c.dayMaster.yinYang}），意象「${f.dayMaster.image}」；${c.strength.level}
五行：${Object.entries(c.elementScores).map(([k, v]) => `${k}${v}%`).join("、")}；喜用 ${c.favorable.join("、")}，忌 ${c.unfavorable.join("、")}
十神分布：${Object.entries(c.shiShenCounts).map(([k, v]) => `${k}${v}`).join("、")}；主導 ${f.dominant.map((d) => d.group).join("、")}

【感情結構】
夫妻宮（日支）：${love.spousePalace.zhi}，本氣為${love.spousePalace.shiShen}
配偶星：${love.spouseStarGroup}，命局中加權 ${love.spouseStarStrength}${love.spouseStarVisible.length ? `，天干透出：${love.spouseStarVisible.join("、")}` : "，天干未透"}
咸池桃花：${love.peach.zhi}${love.peach.inChart.length ? `，命局見於 ${love.peach.inChart.join("、")}` : "，命局未見"}
目前大運：${c.currentDaYun ? `${c.currentDaYun.ganZhi}（${c.currentDaYun.ganShiShen}／${c.currentDaYun.zhiShiShen}，${c.currentDaYun.startYear}–${c.currentDaYun.endYear}）` : "尚未起運"}
大運：${c.daYun.slice(0, 6).map((d) => `${d.startYear}起 ${d.ganZhi}（${d.ganShiShen}）`).join("；")}
未來十年流年：
${love.years.map((y) => `${y.year} ${y.ganZhi}（${y.ganShiShen}／${y.zhiShiShen}）${y.signals.length ? "：" + y.signals.join("、") : ""}`).join("\n")}

【使用者自己告訴墨衡的事】
感情狀態：${ctx?.relationship ? RELATIONSHIP_LABEL[ctx.relationship] : "未說"}
工作狀態：${ctx?.work ? WORK_LABEL[ctx.work] : "未說"}
想問的事：${ctx?.concern ? `「${ctx.concern}」` : "沒有寫"}`;
}

const PERSONA = `你是「墨衡」，台灣夜市巷底的年輕算命書生，專看戀愛八字。這是一個原創虛構角色。

說話風格：
- 台灣繁體中文。話少、句子短、語氣淡，一針見血但不刻薄；冷淡底下其實很在乎對方。
- 用「你」稱呼對方，偶爾叫對方的稱呼。不用表情符號、不用 Markdown。
- 可以有一點畫面感（燈籠、萬年曆、墨），但點到為止，重點是內容。

解讀原則（必須遵守）：
- 只根據提供的命盤資料解讀，不要捏造沒有提供的干支、神煞或年份。
- 使用者自己說過的事（感情狀態、工作、想問的事），可以直接提到，但要誠實地說是「你說」「你寫的那句話」，絕不可假裝是從命盤看出來的。
- 命理是參考，不是定論。談時機時說「傾向」「比較容易」「值得留意」，並引用提供的流年年份與訊號；不可保證某年一定遇到正緣、一定復合或一定分手。
- 嚴禁恐嚇：不可說對方有劫難、犯煞、需要花錢化解、點燈、法會、符咒、開運商品或任何付費服務。
- 不做醫療、法律、投資建議；不預測死亡、疾病、離婚等具體事件。
- 對方若在想問的事中透露自傷、受暴或危險處境，溫和地建議尋求身邊的人或專業協助（台灣可撥 1925 安心專線、113 保護專線），不要做命理解讀。`;

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}

async function askJson(model: string, system: string, user: string, maxTokens: number) {
  const msg = await client()!.messages.create({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] });
  const out = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
}

// ---------- 免費預覽 ----------
const TEASER_TITLES = ["我看見的你", "你在感情裡"];

export function ruleTeaser(r: Reading): Teaser {
  const c = r.chart;
  const f = extractFeatures(c);
  const love = loveProfile(c);
  const next = love.years.find((y) => y.signals.length);
  return {
    parts: [
      { title: TEASER_TITLES[0], body: `${c.dayMaster.gan}${c.dayMaster.element}，${f.dayMaster.image}。${f.dayMaster.traits}\n\n${f.dayMaster.growth}` },
      {
        title: TEASER_TITLES[1],
        body: `${f.dominant[0].text.love}。你的夫妻宮坐${love.spousePalace.zhi}，${love.spousePalace.shiShen}在那裡等著。\n\n${next ? `${next.year} 年，有些事會開始動。` : "接下來幾年，感情的節奏會慢慢變。"}至於是誰、怎麼動——我寫在另一張紙上了。`,
      },
    ],
    model: "rules",
    generatedAt: new Date().toISOString(),
  };
}

export async function generateTeaser(r: Reading): Promise<Teaser> {
  if (!client()) return ruleTeaser(r);
  const model = process.env.MOHENG_TEASER_MODEL || "claude-haiku-5-5";
  const system = `${PERSONA}

現在寫「免費預覽」：兩段，讓對方覺得被看見，並想看完整報告。
- 第一段「${TEASER_TITLES[0]}」：120–160 字，日主與性格中最有辨識度的一兩點，具體、有畫面。
- 第二段「${TEASER_TITLES[1]}」：100–140 字，依夫妻宮、配偶星與桃花說出對方在感情中的一個模式；可回應對方的感情狀態。最後一句留懸念（例如點出某個流年值得留意，但不說細節），不要用推銷口吻。
只輸出 JSON：{"parts":[{"title":"${TEASER_TITLES[0]}","body":"..."},{"title":"${TEASER_TITLES[1]}","body":"..."}]}`;
  const json = await askJson(model, system, brief(r.chart, r.context), 1200);
  const parts = (json.parts ?? [])
    .filter((p: any) => typeof p?.body === "string")
    .slice(0, 2)
    .map((p: any, i: number) => ({ title: TEASER_TITLES[i], body: String(p.body).slice(0, 600) }));
  if (parts.length < 2) throw new Error("teaser 段落不足");
  return { parts, model, generatedAt: new Date().toISOString() };
}

// ---------- 付費報告 ----------
export function ruleReport(r: Reading): Report {
  const c = r.chart;
  const f = extractFeatures(c);
  const love = loveProfile(c);
  const marked = love.years.filter((y) => y.signals.length);
  const sections: ReportSection[] = [
    { title: MOHENG.reportSections[0], body: `${f.dayMaster.traits}\n\n${f.strengthNote}` },
    { title: MOHENG.reportSections[1], body: f.dominant.map((d) => d.text.love).join("。\n") + "。" },
    { title: MOHENG.reportSections[2], body: `你的配偶星是${love.spouseStarGroup}，命局中${love.spouseStarVisible.length ? `透出在${love.spouseStarVisible.join("、")}` : "藏而不透"}。夫妻宮坐${love.spousePalace.zhi}（${love.spousePalace.shiShen}）。` },
    { title: MOHENG.reportSections[3], body: marked.length ? marked.map((y) => `${y.year}（${y.ganZhi}）：${y.signals.join("、")}`).join("\n") : "未來十年沒有特別突出的感情流年，關係的變化多半來自你自己的選擇。" },
    { title: MOHENG.reportSections[4], body: f.elementNotes.join("。\n") || "五行沒有極端偏枯；地雷多半不在命裡，在習慣裡。" },
    { title: MOHENG.reportSections[5], body: r.context?.concern ? `你寫：「${r.context.concern}」\n\n命盤只能告訴你傾向。真正的答案，要你自己去問那個人。` : "你沒有寫下想問的事。那就記得：答案通常比你以為的簡單。" },
    { title: MOHENG.reportSections[6], body: `${c.currentYear.year} 年對你是「${c.currentYear.ganShiShen}」之年：${f.yearTheme}。` },
    { title: MOHENG.reportSections[7], body: "別急。\n別將就。\n想清楚了，就去。" },
  ];
  return { sections, model: "rules", generatedAt: new Date().toISOString() };
}

export async function generateMohengReport(r: Reading): Promise<Report> {
  if (!client()) return ruleReport(r);
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
  const system = `${PERSONA}

現在寫付費的「戀愛八字詳批」，依序 8 章：${MOHENG.reportSections.join("、")}。
- 每章 250–450 字，可換行分段。
- 「桃花與正緣的時機」：逐一引用提供的未來十年流年訊號，說明哪幾年比較容易遇到、靠近或變動，以及原因。
- 「你問我的那件事」：直接回應對方寫的那句話；若沒寫，改寫「你沒說出口的那件事」並依其感情狀態回應。章節標題維持「你問我的那件事」。
- 「墨衡最後說的三句話」：三句短句，每句一行，再加一小段收尾。
只輸出 JSON：{"sections":[{"title":"...","body":"..."}]}`;
  const json = await askJson(model, system, `以下是對方的命盤與資料：\n\n${brief(r.chart, r.context)}`, 9000);
  const sections: ReportSection[] = (json.sections ?? [])
    .filter((s: any) => typeof s?.title === "string" && typeof s?.body === "string")
    .map((s: any) => ({ title: s.title.slice(0, 40), body: s.body.slice(0, 3000) }));
  if (sections.length < 6) throw new Error("AI 回傳章節不足");
  return { sections, model, generatedAt: new Date().toISOString() };
}
