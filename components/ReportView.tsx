"use client";
import { useEffect, useRef, useState } from "react";
import type { Report } from "@/lib/db";

type State = { status: "none" | "generating" | "done" | "failed"; report: Report | null };

export default function ReportView({ id, initial }: { id: string; initial: State }) {
  const [state, setState] = useState<State>(initial);
  const started = useRef(false);

  async function generate() {
    setState((s) => ({ ...s, status: "generating" }));
    try {
      const res = await fetch(`/api/report/${id}`, { method: "POST" });
      const data = await res.json();
      if (data.status === "done") return setState({ status: "done", report: data.report });
      if (data.status === "failed") return setState({ status: "failed", report: null });
      poll(); // 其他請求正在生成中
    } catch {
      poll();
    }
  }

  function poll() {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/report/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (data.status === "done" || data.status === "failed") {
          clearInterval(timer);
          setState({ status: data.status, report: data.report });
        }
      } catch {}
    }, 4000);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (initial.status === "none") generate();
    else if (initial.status === "generating") poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === "done" && state.report) {
    return (
      <div className="card">
        {state.report.sections.map((s) => (
          <section key={s.title} className="report-section">
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <div className="no-print" style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <button className="btn ghost" onClick={() => window.print()}>列印或另存 PDF</button>
        </div>
      </div>
    );
  }
  if (state.status === "failed") {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <p>報告生成時發生問題，你的付款已保留。</p>
        <button className="btn" onClick={generate}>重新生成</button>
      </div>
    );
  }
  return (
    <div className="card" style={{ textAlign: "center", padding: "40px 18px" }}>
      <div className="spinner" />
      <p style={{ margin: 0 }}>正在依你的命盤撰寫詳批報告…</p>
      <p className="muted">約需 30–60 秒，請勿關閉頁面。完成後也可以隨時回到此頁查看。</p>
    </div>
  );
}
