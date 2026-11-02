"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "./PixelEvent";

const HOURS = [
  { v: "unknown", l: "不知道時辰" },
  ...Array.from({ length: 24 }, (_, h) => {
    const zhi = "子丑丑寅寅卯卯辰辰巳巳午午未未申申酉酉戌戌亥亥子"[h];
    return { v: String(h), l: `${String(h).padStart(2, "0")} 時（${zhi}時）` };
  }),
];

export default function BirthForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [year, setYear] = useState("1990");
  const [month, setMonth] = useState("1");
  const [day, setDay] = useState("1");
  const [hour, setHour] = useState("unknown");
  const [minute, setMinute] = useState("0");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [utm, setUtm] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const u: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "channel"].forEach((k) => {
      const v = q.get(k);
      if (v) u[k] = v;
    });
    setUtm(u);
  }, []);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: now - 1920 + 1 }, (_, i) => String(now - i));
  }, []);
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("請填寫姓名或暱稱");
    if (!gender) return setError("請選擇性別（大運順逆需要）");
    if (!consent) return setError("請先閱讀並同意隱私權政策");
    setLoading(true);
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, gender, year, month, day: Math.min(Number(day), daysInMonth), hour, minute, consent, utm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "送出失敗");
      track("Lead");
      router.push(`/r/${data.id}`);
    } catch (err: any) {
      setError(err.message || "送出失敗，請稍後再試");
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="name">姓名或暱稱</label>
        <input id="name" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="報告中怎麼稱呼你" autoComplete="nickname" />
      </div>
      <div className="field">
        <label>性別</label>
        <div className="seg">
          <label><input type="radio" name="g" checked={gender === "male"} onChange={() => setGender("male")} /> 男</label>
          <label><input type="radio" name="g" checked={gender === "female"} onChange={() => setGender("female")} /> 女</label>
        </div>
      </div>
      <div className="field">
        <label>國曆出生日期</label>
        <div className="row">
          <select aria-label="年" value={year} onChange={(e) => setYear(e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y} 年</option>)}
          </select>
          <select aria-label="月" value={month} onChange={(e) => setMonth(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1} 月</option>)}
          </select>
          <select aria-label="日" value={Math.min(Number(day), daysInMonth)} onChange={(e) => setDay(e.target.value)}>
            {Array.from({ length: daysInMonth }, (_, i) => <option key={i} value={i + 1}>{i + 1} 日</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>出生時間</label>
        <div className="row-2">
          <select aria-label="時" value={hour} onChange={(e) => setHour(e.target.value)}>
            {HOURS.map((h) => <option key={h.v} value={h.v}>{h.l}</option>)}
          </select>
          <select aria-label="分" value={minute} disabled={hour === "unknown"} onChange={(e) => setMinute(e.target.value)}>
            {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")} 分</option>)}
          </select>
        </div>
        <div className="hint">請填當地時間；不知道時辰仍可排出年、月、日三柱。</div>
      </div>
      <label className="check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>我已閱讀並同意 <a href="/privacy" target="_blank">隱私權政策</a>，同意本站使用上述資料排盤與產生報告。</span>
      </label>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="btn" disabled={loading}>{loading ? "排盤中…" : "免費排出我的八字命盤"}</button>
    </form>
  );
}
