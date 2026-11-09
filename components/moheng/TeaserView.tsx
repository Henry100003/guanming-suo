"use client";
import { useEffect, useRef, useState } from "react";
import type { Teaser } from "@/lib/db";

type State = { status: "none" | "generating" | "done" | "failed"; teaser: Teaser | null };

export default function TeaserView({ id, initial }: { id: string; initial: State }) {
  const [state, setState] = useState<State>(initial);
  const started = useRef(false);

  async function generate() {
    setState((s) => ({ ...s, status: "generating" }));
    try {
      const res = await fetch(`/api/moheng/teaser/${id}`, { method: "POST" });
      const data = await res.json();
      if (data.status === "done") return setState({ status: "done", teaser: data.teaser });
      if (data.status === "failed") return setState({ status: "failed", teaser: null });
      poll();
    } catch {
      poll();
    }
  }
  function poll() {
    const t = setInterval(async () => {
      try {
        const data = await (await fetch(`/api/moheng/teaser/${id}`, { cache: "no-store" })).json();
        if (data.status === "done" || data.status === "failed") { clearInterval(t); setState({ status: data.status, teaser: data.teaser }); }
      } catch {}
    }, 2500);
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (initial.status === "none" || initial.status === "failed") generate();
    else if (initial.status === "generating") poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === "done" && state.teaser) {
    return (
      <div className="mh-paper">
        <div className="seal-stamp" aria-hidden>墨衡<br />親批</div>
        {state.teaser.parts.map((p) => (
          <section key={p.title}>
            <h2>{p.title}</h2>
            <p>{p.body}</p>
          </section>
        ))}
      </div>
    );
  }
  if (state.status === "failed") {
    return (
      <div className="mh-locked" style={{ textAlign: "center" }}>
        <p className="mh-say">墨乾了。再給我一點時間。</p>
        <button className="mh-btn ghost" onClick={generate}>再試一次</button>
      </div>
    );
  }
  return (
    <div className="mh-locked" style={{ textAlign: "center" }}>
      <div className="mh-ink" />
      <p className="mh-say">他正在寫……</p>
      <p className="mh-note">約 10–20 秒</p>
    </div>
  );
}
