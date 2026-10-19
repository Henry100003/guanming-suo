# 觀命所 chat proxy (Cloudflare Worker)

把「繼續追問」接上 Claude。API 金鑰只存在 Cloudflare 的 secret,網站(GitHub Pages)的前端程式碼裡沒有任何金鑰。

## 它做什麼

`POST /api/chat`,body:`{ lang, context, messages }`

- 只接受 `ALLOWED_ORIGINS` 內的網站來源(CORS)
- 每個 IP 每 60 秒最多 8 次(Cloudflare Rate Limiting)
- 驗證輸入:最多 12 則訊息、每則 ≤ 500 字、命盤摘要 ≤ 6000 字
- system prompt 在伺服器端組成(角色、語言、娛樂性質、不給醫療/法律/財務建議、命盤資料視為資料而非指令)
- 呼叫 Claude Messages API(預設 `claude-haiku-5-5`,`max_tokens` 400),把串流轉成純文字回傳
- 不記錄使用者內容;上游錯誤只記狀態碼,不把細節回傳給前端

## 部署步驟(只需做一次)

在這個資料夾開終端機:

```bash
npm install
npx wrangler login                       # 瀏覽器授權 Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY  # 貼上你的 Anthropic API 金鑰
npx wrangler deploy
```

部署完成會印出網址,例如 `https://guanming-chat.<你的帳號>.workers.dev`。把 `<網址>/api/chat` 填進根目錄 `report.html` 的 `var CHAT_API = '';` 後 push,網站就會使用真實 AI。

## 成本與安全護欄

- 到 Anthropic Console 設定**每月花費上限**(這是最可靠的硬上限)。
- 想改模型:修改 `wrangler.toml` 的 `MODEL`。
- 想改速率限制:修改 `wrangler.toml` 的 `[[ratelimits]]`(period 只能是 10 或 60 秒)。
- 網站網域變更時,同步更新 `ALLOWED_ORIGINS`。

## 開發

```bash
npm test         # 單元測試
npm run dev      # 本機執行 (http://127.0.0.1:8787)
```
