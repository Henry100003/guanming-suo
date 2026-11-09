// 感情相關的規則層：夫妻宮、配偶星、桃花（咸池）、未來十年流年與感情相關的訊號。
// 這些是排盤直接算出的事實，交給 AI 解讀，避免 AI 自行捏造干支或神煞。
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Solar } = require("lunar-javascript");
import { SHISHEN_GROUP, shiShenOf, type Chart } from "./bazi";

const HIDE_MAIN: Record<string, string> = {
  子: "癸", 丑: "己", 寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙", 午: "丁", 未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬",
};
// 咸池桃花：申子辰見酉、寅午戌見卯、巳酉丑見午、亥卯未見子
const PEACH: Record<string, string> = {
  申: "酉", 子: "酉", 辰: "酉", 寅: "卯", 午: "卯", 戌: "卯", 巳: "午", 酉: "午", 丑: "午", 亥: "子", 卯: "子", 未: "子",
};
const CLASH: Record<string, string> = { 子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅", 卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳" };
const COMBINE: Record<string, string> = { 子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午" };

export interface LoveYear {
  year: number;
  ganZhi: string;
  ganShiShen: string;
  zhiShiShen: string;
  signals: string[];
}

export interface LoveProfile {
  spousePalace: { zhi: string; shiShen: string };
  spouseStarGroup: "官殺" | "財星";
  spouseStarStrength: number; // 十神分布中的加權值
  spouseStarVisible: string[]; // 天干透出的配偶星，例：「月柱 正官」
  peach: { zhi: string; inChart: string[] };
  years: LoveYear[];
}

export function loveProfile(c: Chart, now = new Date(), span = 10): LoveProfile {
  const dayGan = c.dayMaster.gan;
  const day = c.pillars.find((p) => p.label === "日柱")!;
  const year = c.pillars.find((p) => p.label === "年柱")!;
  const spouseStarGroup = c.input.gender === "female" ? "官殺" : "財星";

  const peachZhi = new Set([PEACH[day.zhi], PEACH[year.zhi]]);
  const peachInChart = c.pillars.filter((p) => p.label !== "日柱" && peachZhi.has(p.zhi)).map((p) => `${p.label}${p.zhi}`);

  const years: LoveYear[] = [];
  for (let y = now.getFullYear(); y < now.getFullYear() + span; y++) {
    const ec = Solar.fromYmd(y, 6, 1).getLunar().getEightChar();
    const gan: string = ec.getYearGan();
    const zhi: string = ec.getYearZhi();
    const ganSS = shiShenOf(dayGan, gan);
    const zhiSS = shiShenOf(dayGan, HIDE_MAIN[zhi]);
    const signals: string[] = [];
    if (peachZhi.has(zhi)) signals.push("桃花年（流年支逢咸池）");
    if (SHISHEN_GROUP[ganSS] === spouseStarGroup || SHISHEN_GROUP[zhiSS] === spouseStarGroup) signals.push("配偶星流年");
    if (COMBINE[day.zhi] === zhi) signals.push("流年六合夫妻宮（關係易靠近）");
    if (CLASH[day.zhi] === zhi) signals.push("流年沖夫妻宮（關係易變動）");
    years.push({ year: y, ganZhi: gan + zhi, ganShiShen: ganSS, zhiShiShen: zhiSS, signals });
  }

  return {
    spousePalace: { zhi: day.zhi, shiShen: shiShenOf(dayGan, HIDE_MAIN[day.zhi]) },
    spouseStarGroup,
    spouseStarStrength: c.shiShenCounts[spouseStarGroup] ?? 0,
    spouseStarVisible: c.pillars
      .filter((p) => p.label !== "日柱" && SHISHEN_GROUP[p.ganShiShen] === spouseStarGroup)
      .map((p) => `${p.label} ${p.ganShiShen}`),
    peach: { zhi: [...peachZhi].join("、"), inChart: peachInChart },
    years,
  };
}
