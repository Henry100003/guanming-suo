# 八字命盤網站（Next.js + Supabase + 綠界 + Claude）

可實際營運的八字算命網站：免費排盤 → 付費解鎖 AI 詳批報告。

## 功能

- **精準排盤**：依二十四節氣換月、子初換日，含四柱、十神、藏干、十二長生、納音、大運、流年；不知道時辰可排三柱
- **免費命盤頁**：五行分布、身強弱、喜忌、日主解讀、流年主題
- **付費詳批**：綠界信用卡付款 → 自動解鎖 → Claude 依命盤特徵撰寫 8 章約 3,000 字報告，可列印存 PDF
- **廣告追蹤**：記錄 utm 參數；Meta Pixel 送出 Lead / ViewContent / Purchase
- **法遵**：隱私權政策、服務條款、退款政策、數位內容解除權例外同意勾選
- **營運報表**：Supabase 內建 `daily_stats`（每日轉換率、營收）與 `campaign_stats`（各廣告活動成效）

## 上線步驟

1. **Supabase**：建立專案，在 SQL Editor 執行 `supabase/schema.sql`
2. **Anthropic**：到 console.anthropic.com 申請 API 金鑰
3. **綠界**：先用 `.env.example` 內的公開測試商店；正式上線需申請綠界商店（個人賣家或公司行號皆可），取得正式 MerchantID / HashKey / HashIV
4. **部署到 Vercel**：匯入專案，依 `.env.example` 設定環境變數，`NEXT_PUBLIC_SITE_URL` 填正式網域
5. **測試付款**：綠界測試卡號 `4311-9522-2222-2222`，有效期限任意未來日期，CVV `222`，3D 驗證碼 `1234`（以綠界文件為準）
6. **切正式**：`ECPAY_ENV=production` 並換成正式金鑰，確認 `ALLOW_MOCK_PAY=false`

本機開發：`cp .env.example .env.local`，可只設 `ALLOW_MOCK_PAY=true` 不接 Supabase 與綠界（資料存在 `.data/`）。

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # 綠界檢查碼（官方範例）與排盤正確性測試
```

## 上線前必做

- [ ] 公司或行號登記，填入 `NEXT_PUBLIC_COMPANY_NAME` / `TAX_ID`
- [ ] **電子發票**：綠界電子發票需另外申請並串接（本專案未含），或先以手動方式開立
- [ ] 法律頁面為範本，請依實際狀況調整並給法務過目（日期、管轄法院等）
- [ ] 在綠界後台確認 ReturnURL 可從外網連到（`/api/ecpay/notify`）
- [ ] Vercel 方案：報告生成約 30–60 秒，Hobby 方案函式上限可能不夠，建議 Pro
- [ ] FB 廣告文案避免「保證」「一定」等字眼，命理類廣告較容易被審核拒絕

## 架構

| 路徑 | 說明 |
|---|---|
| `lib/bazi.ts` | 排盤核心（lunar-javascript）、五行加權、身強弱、喜忌、大運 |
| `lib/features.ts` | 規則層：日主、十神、五行特徵的文字 |
| `lib/report.ts` | Claude 生成報告的提示詞與防護（禁止恐嚇、推銷化解、醫療投資建議）|
| `lib/ecpay.ts` | 綠界 AIO 檢查碼、表單、回傳驗證 |
| `lib/db.ts` | Supabase 存取；未設定時退回本機 JSON |
| `app/api/ecpay/notify` | 綠界伺服器通知：驗證檢查碼與金額後解鎖，具冪等性 |
| `app/api/report/[id]` | 報告生成與狀態查詢，防止重複呼叫 AI |

調整價格、品牌名稱都在環境變數；報告語氣與章節在 `lib/report.ts` 的 `SYSTEM_PROMPT`。
