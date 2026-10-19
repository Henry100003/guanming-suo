import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { toTextStream, validateMessages, buildSystemPrompt } from "../src/index.js";

const ORIGIN = "https://henry100003.github.io";
const env = (over = {}) => ({ ALLOWED_ORIGINS: ORIGIN, ANTHROPIC_API_KEY: "test-key", ...over });

const post = (body, headers = {}) =>
  new Request("https://w.example/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", Origin: ORIGIN, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const goodBody = { lang: "en", context: "Sun sign: Taurus", messages: [{ role: "user", content: "hi" }] };

test("toTextStream extracts only text deltas from SSE, even split across chunks", async () => {
  const sse =
    'event: message_start\ndata: {"type":"message_start"}\n\n' +
    'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"你好"}}\n\n' +
    'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"，世界"}}\n\n' +
    'event: ping\ndata: {"type":"ping"}\n\n' +
    'event: message_stop\ndata: {"type":"message_stop"}\n\n';
  const bytes = new TextEncoder().encode(sse);
  const stream = new ReadableStream({
    start(c) {
      for (let i = 0; i < bytes.length; i += 7) c.enqueue(bytes.slice(i, i + 7)); // awkward chunk size splits multibyte chars
      c.close();
    },
  });
  const out = await new Response(toTextStream(stream)).text();
  assert.equal(out, "你好，世界");
});

test("validateMessages accepts a normal chat and merges same-role neighbours", () => {
  const r = validateMessages([
    { role: "user", content: "a" },
    { role: "user", content: "b" },
    { role: "assistant", content: "c" },
    { role: "user", content: "d" },
  ]);
  assert.equal(r.ok, true);
  assert.equal(r.messages.length, 3);
  assert.equal(r.messages[0].content, "a\nb");
});

test("validateMessages rejects bad shapes", () => {
  assert.equal(validateMessages([]).ok, false);
  assert.equal(validateMessages("x").ok, false);
  assert.equal(validateMessages([{ role: "system", content: "x" }]).ok, false);
  assert.equal(validateMessages([{ role: "assistant", content: "x" }]).ok, false); // must start with user
  assert.equal(validateMessages([{ role: "user", content: "x".repeat(501) }]).ok, false);
  assert.equal(validateMessages(Array(13).fill({ role: "user", content: "x" })).ok, false);
});

test("system prompt embeds language and keeps chart data inside a data block", () => {
  const p = buildSystemPrompt("ja", "CTX");
  assert.match(p, /日本語/);
  assert.match(p, /<chart_data>\nCTX\n<\/chart_data>/);
});

test("rejects requests from a disallowed origin", async () => {
  const res = await worker.fetch(post(goodBody, { Origin: "https://evil.example" }), env());
  assert.equal(res.status, 403);
});

test("rejects requests with no Origin header", async () => {
  const req = new Request("https://w.example/api/chat", { method: "POST", body: JSON.stringify(goodBody) });
  assert.equal((await worker.fetch(req, env())).status, 403);
});

test("CORS preflight succeeds for the allowed origin only", async () => {
  const ok = await worker.fetch(new Request("https://w.example/api/chat", { method: "OPTIONS", headers: { Origin: ORIGIN } }), env());
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  const bad = await worker.fetch(new Request("https://w.example/api/chat", { method: "OPTIONS", headers: { Origin: "https://evil.example" } }), env());
  assert.equal(bad.status, 403);
});

test("rejects bad JSON, bad messages, wrong path and wrong method", async () => {
  assert.equal((await worker.fetch(post("{not json"), env())).status, 400);
  assert.equal((await worker.fetch(post({ messages: [] }), env())).status, 400);
  assert.equal((await worker.fetch(new Request("https://w.example/other", { method: "POST", headers: { Origin: ORIGIN } }), env())).status, 404);
  assert.equal((await worker.fetch(new Request("https://w.example/api/chat", { method: "GET", headers: { Origin: ORIGIN } }), env())).status, 405);
});

test("enforces the rate limiter when the binding says no", async () => {
  const limiter = { limit: async () => ({ success: false }) };
  assert.equal((await worker.fetch(post(goodBody), env({ CHAT_LIMITER: limiter }))).status, 429);
});

test("returns 500 (no details) when the API key secret is missing", async () => {
  const res = await worker.fetch(post(goodBody), env({ ANTHROPIC_API_KEY: undefined }));
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { error: "server_misconfigured" });
});

test("streams text back and sends the right upstream request", async () => {
  const realFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, init };
    const sse = 'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n';
    return new Response(sse, { status: 200 });
  };
  try {
    const res = await worker.fetch(post(goodBody), env({ MODEL: "claude-haiku-5-5" }));
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "Hello");
    assert.equal(captured.url, "https://api.anthropic.com/v1/messages");
    assert.equal(captured.init.headers["x-api-key"], "test-key");
    const sent = JSON.parse(captured.init.body);
    assert.equal(sent.model, "claude-haiku-5-5");
    assert.equal(sent.max_tokens, 400);
    assert.equal(sent.stream, true);
    assert.equal(sent.messages[0].content, "hi");
    assert.match(sent.system, /Taurus/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("maps upstream failures to 502/503 without leaking details", async () => {
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("secret upstream detail", { status: 500 });
    let res = await worker.fetch(post(goodBody), env());
    assert.equal(res.status, 502);
    assert.equal((await res.text()).includes("secret"), false);
    globalThis.fetch = async () => new Response("slow down", { status: 429 });
    res = await worker.fetch(post(goodBody), env());
    assert.equal(res.status, 503);
  } finally {
    globalThis.fetch = realFetch;
  }
});
