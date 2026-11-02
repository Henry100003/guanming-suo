import { computeChart } from "../lib/bazi";
// 已知命例比對（依節氣換月）
const cases: [number, number, number, number, string][] = [
  [1990, 5, 15, 14, "庚午 辛巳 庚辰 癸未"],
  [2000, 2, 4, 21, "庚辰 戊寅 壬辰 辛亥"], // 立春 20:40 之後 → 庚辰年
  [2000, 2, 4, 19, "己卯 丁丑 壬辰 庚戌"], // 立春前仍屬己卯年
  [1984, 2, 2, 12, "癸亥 乙丑 丙寅 甲午"],
];
let fail = 0;
for (const [y, m, d, h, exp] of cases) {
  const c = computeChart({ name: "t", gender: "male", year: y, month: m, day: d, hour: h, minute: 0 });
  const got = c.pillars.map((p) => p.gan + p.zhi).join(" ");
  const ok = got === exp;
  if (!ok) fail++;
  console.log(ok ? "OK  " : "FAIL", `${y}/${m}/${d} ${h}h`, got, ok ? "" : `(expected ${exp})`);
}
const c = computeChart({ name: "t", gender: "female", year: 1990, month: 5, day: 15, hour: null, minute: 0 });
console.log("3 pillars:", c.pillars.length === 3 ? "OK" : "FAIL", c.strength, c.favorable, c.daYun.slice(0, 3).map((d) => d.ganZhi + d.startAge));
if (fail) process.exit(1);
