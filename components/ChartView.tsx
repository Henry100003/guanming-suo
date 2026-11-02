import type { Chart } from "@/lib/bazi";
import { ELEMENTS } from "@/lib/bazi";

export default function ChartView({ chart }: { chart: Chart }) {
  const c = chart;
  const now = c.currentYear.year;
  return (
    <>
      <div className="card">
        <h2>{c.input.name} 的八字命盤</h2>
        <p className="muted" style={{ marginTop: -6 }}>
          國曆 {c.input.year}/{c.input.month}/{c.input.day}
          {c.hourKnown ? ` ${String(c.input.hour).padStart(2, "0")}:${String(c.input.minute).padStart(2, "0")}` : "（時辰不詳）"}
          　農曆 {c.lunarText}　生肖{c.zodiac}
        </p>
        <div className="pillars" style={{ ["--cols" as any]: c.pillars.length }}>
          {c.pillars.map((p) => (
            <div key={p.label} className={`pillar ${p.label === "日柱" ? "day" : ""}`}>
              <div className="lbl">{p.label}</div>
              <div className="ss">{p.ganShiShen}</div>
              <div className={`gz el-${p.ganElement}`}>{p.gan}</div>
              <div className={`gz el-${p.zhiElement}`}>{p.zhi}</div>
              <div className="meta">
                {p.hideGan.map((h) => (
                  <div key={h.gan}><span className={`el-${h.element}`}>{h.gan}</span> {h.shiShen}</div>
                ))}
                <div>{p.diShi}</div>
                <div>{p.naYin}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>五行分布</h2>
        <div className="bars">
          {ELEMENTS.map((e) => (
            <div className="bar" key={e}>
              <span className={`el-${e}`} style={{ fontWeight: 700 }}>{e}</span>
              <div className="track"><div className={`fill bg-${e}`} style={{ width: `${Math.max(c.elementScores[e], 1)}%` }} /></div>
              <span className="v">{c.elementScores[e]}%</span>
            </div>
          ))}
        </div>
        <p style={{ marginBottom: 6 }}>
          日主 <b className={`el-${c.dayMaster.element}`}>{c.dayMaster.gan}{c.dayMaster.element}</b>（{c.dayMaster.yinYang}），
          判斷為 <b>{c.strength.level}</b>
        </p>
        <div className="tags">
          {c.favorable.map((e) => <span key={e} className="tag good">喜 {e}</span>)}
          {c.unfavorable.map((e) => <span key={e} className="tag bad">忌 {e}</span>)}
        </div>
        <p className="muted" style={{ marginTop: 10 }}>五行比例依天干與地支藏干加權計算，月令加重；喜忌採扶抑法簡化判斷，供參考。</p>
      </div>

      <div className="card">
        <h2>大運</h2>
        <p className="muted" style={{ marginTop: -6 }}>出生後約 {c.yunStart.years} 年 {c.yunStart.months} 個月起運，每步十年</p>
        <div className="dayun">
          {c.daYun.map((d) => (
            <div key={d.ganZhi + d.startYear} className={`yun ${now >= d.startYear && now <= d.endYear ? "now" : ""}`}>
              <div>{d.startAge} 歲</div>
              <b>{d.ganZhi}</b>
              <div>{d.ganShiShen}</div>
              <div>{d.startYear}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
