// 付費報告：規則層整理命盤特徵 → Claude 寫成完整解讀；無 API 金鑰或失敗時退回純規則版本
import Anthropic from "@anthropic-ai/sdk";
import type { Chart } from "./bazi";
import { extractFeatures, SHISHEN_YEAR_THEME, ELEMENT_HINT } from "./features";
import type { Report, ReportSection } from "./db";

const SECTION_TITLES = [
  "命格總論", "性格與天賦", "事業與財運", "感情與人際", "身心與生活節奏", "大運走勢", "今年流年", "給你的行動建議",
];

const SYSTEM_PROMPT = `你是一位資深、溫和且務實的八字命理作者，為付費用戶撰寫個人化的「八字詳批報告」。

寫作原則：
- 使用台灣繁體中文，語氣親切、具體、正向但不浮誇，像一位值得信任的老師在當面解說。
- 只根據提供的命盤資料與特徵解讀，不要捏造命盤中沒有的干支或神煞。適度解釋術語（例如「七殺」代表壓力與魄力）。
- 命理是自我了解與人生規劃的參考，不是定論。描述傾向與可能性，避免「一定」「注定」等絕對說法。
- 嚴禁恐嚇式內容：不可說用戶有劫難、被沖煞、需要花錢化解、購買法會、符咒、開運商品或任何付費服務。
- 不做醫療、法律、投資的具體建議；「身心與生活節奏」只談作息、情緒與壓力調節等一般生活建議，提到身體不適時建議就醫。
- 不預測死亡、重大疾病、離婚等具體事件。
- 行動建議要具體可行，結合用戶的喜用五行（顏色、方位、適合領域）與性格特質。

輸出格式：只輸出 JSON，不要任何其他文字：
{"sections":[{"title":"命格總論","body":"..."}, ...]}
依序包含以下章節：${SECTION_TITLES.join("、")}。每章 250–450 字，可用換行分段，不要使用 Markdown 標記。`;

function chartBrief(c: Chart) {
  const f = extractFeatures(c);
  const pillarLines = c.pillars
    .map((p) => `${p.label}：${p.gan}${p.zhi}（天干十神 ${p.ganShiShen}；藏干 ${p.hideGan.map((h) => `${h.gan}${h.shiShen}`).join("、")}；${p.diShi}；納音 ${p.naYin}）`)
    .join("\n");
  return {
    features: f,
    text: `稱呼：${c.input.name}
性別：${c.input.gender === "male" ? "男" : "女"}
國曆生日：${c.input.year}/${c.input.month}/${c.input.day} ${c.hourKnown ? `${c.input.hour}:${String(c.input.minute).padStart(2, "0")}` : "（時辰不詳，只排三柱）"}
農曆：${c.lunarText}　生肖：${c.zodiac}

四柱：
${pillarLines}

日主：${c.dayMaster.gan}（${c.dayMaster.yinYang}${c.dayMaster.element}），意象「${f.dayMaster.image}」
五行分布（加權%）：${Object.entries(c.elementScores).map(([k, v]) => `${k}${v}`).join("、")}
身強弱：${c.strength.level}（扶助力量約 ${c.strength.score}%）
喜用五行：${c.favorable.join("、")}；忌：${c.unfavorable.join("、")}
十神分布：${Object.entries(c.shiShenCounts).map(([k, v]) => `${k}${v}`).join("、")}
主導十神：${f.dominant.map((d) => d.group).join("、")}；最弱：${f.weakest.group}
${f.elementNotes.join("\n")}

起運：出生後約 ${c.yunStart.years} 年 ${c.yunStart.months} 個月
大運：${c.daYun.map((d) => `${d.startAge}歲 ${d.ganZhi}（${d.ganShiShen}/${d.zhiShiShen}，${d.startYear}–${d.endYear}）`).join("；")}
目前大運：${c.currentDaYun ? `${c.currentDaYun.ganZhi}（${c.currentDaYun.ganShiShen}）` : "尚未起運或超出範圍"}
${c.currentYear.year} 流年：${c.currentYear.ganZhi}（天干 ${c.currentYear.ganShiShen}，地支本氣 ${c.currentYear.zhiShiShen}）`,
  };
}

export function ruleBasedReport(c: Chart): Report {
  const f = extractFeatures(c);
  const hints = f.favorableHints.map((h) => `${h.element}：顏色 ${h.color}，方位 ${h.direction}，相關領域 ${h.field}`).join("\n");
  const sections: ReportSection[] = [
    { title: "命格總論", body: `你的日主是${c.dayMaster.gan}${c.dayMaster.element}，意象如「${f.dayMaster.image}」。${f.dayMaster.traits}\n\n命局判斷為${c.strength.level}。${f.strengthNote}` },
    { title: "性格與天賦", body: f.dominant.map((d) => `${d.group}較旺：${d.text.strong}。`).join("\n") + `\n\n${f.dayMaster.growth}` },
    { title: "事業與財運", body: f.dominant.map((d) => d.text.career).join("；") + "。\n\n喜用五行相關的領域也值得參考：\n" + f.favorableHints.map((h) => `${h.element}──${h.field}`).join("\n") },
    { title: "感情與人際", body: f.dominant.map((d) => d.text.love).join("；") + "。" },
    { title: "身心與生活節奏", body: (f.elementNotes.join("。\n") || "五行分布沒有極端偏枯。") + "\n\n維持規律作息、適度運動與情緒抒發，是任何命盤都適用的基本功；身體若有不適請以醫師建議為準。" },
    { title: "大運走勢", body: c.daYun.map((d) => `${d.startAge} 歲起 ${d.ganZhi} 運（${d.startYear}–${d.endYear}）：${SHISHEN_YEAR_THEME[d.ganShiShen]}`).join("\n") },
    { title: "今年流年", body: `${c.currentYear.year} 年為 ${c.currentYear.ganZhi} 年，對你而言是「${c.currentYear.ganShiShen}」之年：${f.yearTheme}。` },
    { title: "給你的行動建議", body: `你的喜用五行為 ${c.favorable.join("、")}：\n${hints}\n\n把這些元素自然地融入穿搭、居家與工作選擇中，重點在於順著自己的特質做決定。` },
  ];
  return { sections, model: "rules", generatedAt: new Date().toISOString() };
}

export async function generateReport(c: Chart): Promise<Report> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return ruleBasedReport(c);
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
  const client = new Anthropic({ apiKey });
  const { text } = chartBrief(c);
  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `以下是用戶的命盤資料，請撰寫詳批報告：\n\n${text}` }],
    });
    const out = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const json = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    const sections: ReportSection[] = (json.sections ?? [])
      .filter((s: any) => s && typeof s.title === "string" && typeof s.body === "string")
      .map((s: any) => ({ title: s.title.slice(0, 40), body: s.body.slice(0, 3000) }));
    if (sections.length < 5) throw new Error("AI 回傳章節不足");
    return { sections, model, generatedAt: new Date().toISOString() };
  } catch (err) {
    // 拋出讓呼叫端標記 failed，前端可重試；不靜默降級，避免付費用戶拿到較陽春的版本
    console.error("[report] AI 生成失敗", err);
    throw err;
  }
}

export { ELEMENT_HINT };
