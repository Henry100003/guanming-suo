import { computeChart } from "../lib/bazi";
import { equationOfTime, isTaiwanDst, toTrueSolarTime, findPlace } from "../lib/solarTime";
import { loveProfile } from "../lib/love";
import { parseMohengInput, ruleTeaser, ruleReport } from "../lib/moheng";
import { MOHENG } from "../content/moheng";

let fail = 0;
const check = (name: string, ok: boolean, info: unknown = "") => { if (!ok) fail++; console.log(ok ? "OK  " : "FAIL", name, ok ? "" : info); };

// 均時差：2 月中約 −14 分、11 月初約 +16 分
check("EoT Feb 11 ≈ -14", Math.abs(equationOfTime(2024, 2, 11) + 14.2) < 1, equationOfTime(2024, 2, 11));
check("EoT Nov 3 ≈ +16.4", Math.abs(equationOfTime(2024, 11, 3) - 16.4) < 1, equationOfTime(2024, 11, 3));

// 台灣日光節約時間
check("DST 1979-07-15", isTaiwanDst(1979, 7, 15));
check("no DST 1979-10-01", !isTaiwanDst(1979, 10, 1));
check("no DST 1990", !isTaiwanDst(1990, 7, 1));

// 台北 1975/7/1 08:00（日光節約）→ 扣 60 分、經度 +6.2 分、均時差約 −3.7 分 ≈ 07:02
const st = toTrueSolarTime({ year: 1975, month: 7, day: 1, hour: 8, minute: 0 }, findPlace("taipei")!)!;
check("Taipei 1975 DST solar time ≈ 07:02", st.hour === 7 && Math.abs(st.minute - 2) <= 1, st);

// 真太陽時造成跨時辰：台南 2000/2/12 13:05（均時差約 −14、經度 +0.8）→ 12:52 → 午時
const noPlace = computeChart({ name: "t", gender: "female", year: 2000, month: 2, day: 12, hour: 13, minute: 5 });
const tainan = computeChart({ name: "t", gender: "female", year: 2000, month: 2, day: 12, hour: 13, minute: 5, place: "tainan" });
check("hour pillar 未 without correction", noPlace.pillars[3].zhi === "未", noPlace.pillars[3]);
check("hour pillar 午 with true solar time", tainan.pillars[3].zhi === "午", tainan.pillars[3]);

// 跨日：23:10 校正後回到 22:5x，不應換成隔日日柱
const late = computeChart({ name: "t", gender: "male", year: 2000, month: 2, day: 12, hour: 23, minute: 5, place: "tainan" });
const lateNo = computeChart({ name: "t", gender: "male", year: 2000, month: 2, day: 12, hour: 23, minute: 5 });
check("late-night correction keeps day pillar", late.pillars[2].gan + late.pillars[2].zhi !== lateNo.pillars[2].gan + lateNo.pillars[2].zhi && late.pillars[3].zhi === "亥", { late: late.pillars.map((p) => p.gan + p.zhi), lateNo: lateNo.pillars.map((p) => p.gan + p.zhi) });

// 感情結構
const lp = loveProfile(tainan, new Date("2026-06-01"));
check("love years = 10", lp.years.length === 10 && lp.years[0].year === 2026, lp.years.length);
check("female spouse star 官殺", lp.spouseStarGroup === "官殺");
console.log("    ", lp.spousePalace, lp.peach, lp.years.filter((y) => y.signals.length).map((y) => `${y.year}${y.ganZhi}:${y.signals.join("/")}`).join(" "));

// 輸入解析（含農曆）
const lunar = parseMohengInput({ name: "小美", gender: "female", calendar: "lunar", year: 1990, month: 1, day: 1, hour: "unknown", email: "a@b.co" });
check("lunar 1990 正月初一 → 1990/1/27", typeof lunar !== "string" && lunar.birth.year === 1990 && lunar.birth.month === 1 && lunar.birth.day === 27, lunar);
check("bad email rejected", typeof parseMohengInput({ name: "x", gender: "male", year: 1990, month: 1, day: 1, email: "nope" }) === "string");
const ok = parseMohengInput({ name: "x", gender: "male", year: 1990, month: 1, day: 1, hour: 8, place: "taichung", email: "X@Example.com", relationship: "crush", work: "bogus", concern: "  我們會在一起嗎  " });
check("context sanitized", typeof ok !== "string" && ok.context.relationship === "crush" && ok.context.work === undefined && ok.context.concern === "我們會在一起嗎" && ok.email === "x@example.com" && ok.birth.place === "taichung", ok);

// 規則版預覽與報告（沒有 API 金鑰時的後備）
const fakeReading: any = { chart: tainan, context: { relationship: "breakup", concern: "我們會復合嗎" } };
check("rule teaser has 2 parts", ruleTeaser(fakeReading).parts.length === 2);
const rr = ruleReport(fakeReading);
check("rule report sections match script", rr.sections.map((s) => s.title).join() === MOHENG.reportSections.join());

if (fail) { console.log(`${fail} failed`); process.exit(1); }
