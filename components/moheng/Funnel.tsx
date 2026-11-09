"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MOHENG, type InputStep } from "@/content/moheng";
import { BIRTH_PLACES } from "@/lib/solarTime";
import { track } from "@/components/PixelEvent";
import Stage from "./Stage";

type Values = {
  calendar: "solar" | "lunar";
  year: string; month: string; day: string; leapMonth: boolean;
  hour: string | null; minute: string;
  place: string;
  gender: "male" | "female" | "";
  name: string;
  relationship: string; work: string; concern: string;
  email: string; consent: boolean; marketingOptIn: boolean;
};

const INITIAL: Values = {
  calendar: "solar", year: "1995", month: "1", day: "1", leapMonth: false,
  hour: "12", minute: "0", place: "taipei", gender: "", name: "",
  relationship: "", work: "", concern: "", email: "", consent: false, marketingOptIn: false,
};

/** 打字機效果；點一下直接顯示全文 */
function useTypewriter(text: string, speed = 38) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(text.length); return; }
    const t = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(t), v) : v + 1)), speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return { shown: text.slice(0, n), done: n >= text.length, finish: () => setN(text.length) };
}

type Pos =
  | { phase: "cover" }
  | { phase: "scene"; i: number; reply?: string }
  | { phase: "input"; i: number };

export default function Funnel() {
  const router = useRouter();
  const [pos, setPos] = useState<Pos>({ phase: "cover" });
  const [history, setHistory] = useState<Pos[]>([]);
  const [v, setV] = useState<Values>(INITIAL);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingLine, setLoadingLine] = useState(0);
  const utm = useRef<Record<string, string>>({});

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "channel", "fbclid"].forEach((k) => {
      const val = q.get(k);
      if (val) utm.current[k] = val;
    });
  }, []);

  // 不知道時辰就跳過出生地
  const inputs = useMemo(
    () => MOHENG.inputs.filter((s) => !(s.kind === "birthPlace" && v.hour === null)),
    [v.hour],
  );
  const totalSteps = MOHENG.scenes.length + inputs.length;
  const progress =
    pos.phase === "cover" ? 0 : pos.phase === "scene" ? (pos.i + 1) / totalSteps : (MOHENG.scenes.length + pos.i + 1) / totalSteps;

  const go = (next: Pos) => { setHistory((h) => [...h, pos]); setError(""); setPos(next); };
  const back = () => { setError(""); setHistory((h) => { const p = h[h.length - 1]; if (p) setPos(p); return h.slice(0, -1); }); };
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }));

  const nextAfterScene = (i: number): Pos => (i + 1 < MOHENG.scenes.length ? { phase: "scene", i: i + 1 } : { phase: "input", i: 0 });
  const nextInput = (i: number, patch?: Partial<Values>) => {
    if (patch) setV((s) => ({ ...s, ...patch }));
    // 依更新後的 hour 決定是否有出生地這一步
    const hour = patch && "hour" in patch ? patch.hour : v.hour;
    const list = MOHENG.inputs.filter((s) => !(s.kind === "birthPlace" && hour === null));
    const cur = inputs[i];
    const idx = list.findIndex((s) => s.kind === cur.kind);
    go({ phase: "input", i: idx + 1 });
  };

  async function submit() {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) return setError("信箱格式不太對，再看一次？");
    if (!v.consent) return setError("請先勾選同意隱私權政策");
    setSubmitting(true);
    const timer = setInterval(() => setLoadingLine((n) => Math.min(n + 1, MOHENG.loadingLines.length - 1)), 1400);
    try {
      const res = await fetch("/api/moheng/readings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...v, hour: v.hour ?? "unknown", utm: utm.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "送出失敗");
      track("Lead", { content_name: "moheng" });
      router.push(`/m/${data.id}`);
    } catch (e: any) {
      clearInterval(timer);
      setSubmitting(false);
      setError(e.message || "送出失敗，請稍後再試");
    }
  }

  // ---------- 封面 ----------
  if (pos.phase === "cover") {
    return (
      <Stage bg="alley" portrait="glance">
        <div className="mh-cover">
          <div className="kicker">{MOHENG.theme}</div>
          <h1>{MOHENG.name}</h1>
          <div className="title">{MOHENG.title}</div>
          <p className="tagline">「{MOHENG.cover.tagline}」</p>
          <button className="mh-btn" onClick={() => go({ phase: "scene", i: 0 })}>{MOHENG.cover.cta}</button>
          <div className="sub">{MOHENG.cover.sub}</div>
        </div>
      </Stage>
    );
  }

  // ---------- 劇情 ----------
  if (pos.phase === "scene") {
    const scene = MOHENG.scenes[pos.i];
    return (
      <Stage bg={scene.bg} portrait={scene.portrait} progress={progress} onBack={back}>
        <ScenePanel
          key={`${pos.i}-${pos.reply ?? ""}`}
          speaker={scene.kind === "speech" ? MOHENG.name : undefined}
          narration={scene.kind === "narration"}
          text={pos.reply ?? scene.text}
          choices={pos.reply ? [{ label: "……", next: () => go(nextAfterScene(pos.i)) }] : scene.choices.map((c) => ({
            label: c.label,
            next: () => (c.reply ? go({ phase: "scene", i: pos.i, reply: c.reply }) : go(nextAfterScene(pos.i))),
          }))}
          skip={pos.i === 0 && !pos.reply ? () => go({ phase: "input", i: 0 }) : undefined}
        />
      </Stage>
    );
  }

  // ---------- 輸入 ----------
  const step = inputs[pos.i];
  return (
    <>
      <Stage bg="table" portrait={step.portrait} progress={progress} onBack={back}>
        <div className="mh-panel" key={step.kind}>
          {step.lead && <p className="mh-lead">{step.lead}</p>}
          <p className="mh-prompt">{step.prompt}</p>
          {step.hint && <p className="mh-hint">{step.hint}</p>}
          <InputBody step={step} v={v} set={set} next={(patch) => nextInput(pos.i, patch)} submit={submit} submitting={submitting} />
          {error && <div className="mh-error" role="alert">{error}</div>}
        </div>
      </Stage>
      {submitting && (
        <div className="mh mh-loading" role="status">
          <div>
            <div className="mh-ink" />
            <p key={loadingLine}>{MOHENG.loadingLines[loadingLine]}</p>
          </div>
        </div>
      )}
    </>
  );
}

function ScenePanel({
  speaker, narration, text, choices, skip,
}: {
  speaker?: string; narration: boolean; text: string;
  choices: { label: string; next: () => void }[]; skip?: () => void;
}) {
  const { shown, done, finish } = useTypewriter(text);
  return (
    <div className="mh-panel" onClick={() => !done && finish()}>
      {speaker && <div className="mh-speaker">{speaker}</div>}
      <p className={`mh-line ${narration ? "narration" : ""}`} aria-live="polite">{shown}</p>
      {done ? (
        <div className="mh-choices">
          {choices.map((c) => (
            <button key={c.label} className={`mh-choice ${c.label === "……" ? "center" : ""}`} onClick={c.next}>{c.label}</button>
          ))}
          {skip && <button className="mh-btn ghost" onClick={skip}>跳過故事，直接開始</button>}
        </div>
      ) : (
        <div className="mh-tap">點一下顯示全文</div>
      )}
    </div>
  );
}

function InputBody({
  step, v, set, next, submit, submitting,
}: {
  step: InputStep;
  v: Values;
  set: <K extends keyof Values>(k: K, val: Values[K]) => void;
  next: (patch?: Partial<Values>) => void;
  submit: () => void;
  submitting: boolean;
}) {
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: now - 1920 + 1 }, (_, i) => String(now - i));
  }, []);
  const maxDay = v.calendar === "lunar" ? 30 : new Date(Number(v.year), Number(v.month), 0).getDate();

  switch (step.kind) {
    case "birthDate":
      return (
        <>
          <div className="mh-seg" role="group" aria-label="曆法">
            <button aria-pressed={v.calendar === "solar"} onClick={() => set("calendar", "solar")}>國曆</button>
            <button aria-pressed={v.calendar === "lunar"} onClick={() => set("calendar", "lunar")}>農曆</button>
          </div>
          <div className="mh-row">
            <select aria-label="年" value={v.year} onChange={(e) => set("year", e.target.value)}>
              {years.map((y) => <option key={y} value={y}>{y} 年</option>)}
            </select>
            <select aria-label="月" value={v.month} onChange={(e) => set("month", e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{v.calendar === "lunar" ? `${"正二三四五六七八九十冬臘"[i]}月` : `${i + 1} 月`}</option>)}
            </select>
            <select aria-label="日" value={Math.min(Number(v.day), maxDay)} onChange={(e) => set("day", e.target.value)}>
              {Array.from({ length: maxDay }, (_, i) => <option key={i} value={i + 1}>{i + 1} 日</option>)}
            </select>
          </div>
          {v.calendar === "lunar" && (
            <label className="mh-check"><input type="checkbox" checked={v.leapMonth} onChange={(e) => set("leapMonth", e.target.checked)} /> 這是閏月</label>
          )}
          <button className="mh-btn" onClick={() => next({ day: String(Math.min(Number(v.day), maxDay)) })}>確認</button>
        </>
      );
    case "birthTime":
      return (
        <>
          <div className="mh-row-2">
            <select aria-label="時" value={v.hour ?? "12"} onChange={(e) => set("hour", e.target.value)}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")} 時（{"子丑丑寅寅卯卯辰辰巳巳午午未未申申酉酉戌戌亥亥子"[h]}時）</option>)}
            </select>
            <select aria-label="分" value={v.minute} onChange={(e) => set("minute", e.target.value)}>
              {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")} 分</option>)}
            </select>
          </div>
          <button className="mh-btn" onClick={() => next({ hour: v.hour ?? "12" })}>確認</button>
          <button className="mh-btn ghost" onClick={() => next({ hour: null })}>{step.skipLabel}</button>
        </>
      );
    case "birthPlace":
      return (
        <>
          <select aria-label="出生地" value={v.place} onChange={(e) => set("place", e.target.value)}>
            {BIRTH_PLACES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button className="mh-btn" onClick={() => next()}>確認</button>
        </>
      );
    case "gender":
    case "relationship":
    case "work":
      return (
        <div className="mh-choices">
          {step.options!.map((o) => (
            <button key={o.value} className="mh-choice" onClick={() => next({ [step.kind]: o.value } as Partial<Values>)}>{o.label}</button>
          ))}
        </div>
      );
    case "name":
      return (
        <form className="mh-choices" onSubmit={(e) => { e.preventDefault(); if (v.name.trim()) next(); }}>
          <input autoFocus value={v.name} maxLength={20} placeholder={step.placeholder} onChange={(e) => set("name", e.target.value)} autoComplete="nickname" />
          <button className="mh-btn" disabled={!v.name.trim()}>確認</button>
        </form>
      );
    case "concern":
      return (
        <>
          <textarea value={v.concern} maxLength={200} placeholder={step.placeholder} onChange={(e) => set("concern", e.target.value)} />
          <button className="mh-btn" disabled={!v.concern.trim()} onClick={() => next()}>交給他</button>
          <button className="mh-btn ghost" onClick={() => next({ concern: "" })}>{step.skipLabel}</button>
        </>
      );
    case "email":
      return (
        <form className="mh-choices" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input type="email" inputMode="email" autoComplete="email" value={v.email} placeholder={step.placeholder} onChange={(e) => set("email", e.target.value)} />
          <label className="mh-check">
            <input type="checkbox" checked={v.consent} onChange={(e) => set("consent", e.target.checked)} />
            <span>我同意 <a href="/privacy" target="_blank">隱私權政策</a>，同意本站以上述資料排盤、產生報告並寄送結果。</span>
          </label>
          <label className="mh-check">
            <input type="checkbox" checked={v.marketingOptIn} onChange={(e) => set("marketingOptIn", e.target.checked)} />
            <span>願意收到新角色與優惠通知（可隨時取消，非必選）</span>
          </label>
          <button className="mh-btn" disabled={submitting}>看他寫了什麼</button>
        </form>
      );
  }
}
