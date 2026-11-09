# 八字命盤網站（Next.js + Supabase + 綠界 + Claude）

可實際營運的八字算命網站：免費排盤 → 付費解鎖 AI 詳批報告。

## 功能

- **精準排盤**：依二十四節氣換月、子初換日，含四柱、十神、藏干、十二長生、納音、大運、流年；不知道時辰可排三柱
- **免費命盤頁**：五行分布、身強弱、喜忌、日主解讀、流年主題
- **付費詳批**：綠界信用卡付款 → 自動解鎖 → Claude 依命盤特徵撰寫 8 章約 3,000 字報告，可列印存 PDF
- **廣告追蹤**：記錄 utm 參數；Meta Pixel 送出 Lead / ViewContent / Purchase
- **法遵**：隱私權政策、服務條款、退款政策、數位內容解除權例外同意勾選
- **營運報表**：Supabase 內建 `daily_stats`（每日轉換率、營收）與 `campaign_stats`（各廣告活動成效）

## 角色漏斗：墨衡（`/moheng`）

夜市巷底的算命書生，主打戀愛八字。流程：

封面 → 4 幕劇情（可跳過）→ 一題一頁輸入（生日國曆／農曆、時辰、出生地、性別、稱呼、感情狀態、工作、想問的事）→ 留 Email → 免費預覽（`/m/[id]`）→ 綠界付款 → 8 章戀愛詳批（`/m/[id]/report`）

- **改劇本**：所有台詞、選項、章節都在 `content/moheng.ts`，不用改程式
- **真太陽時**：依出生地經度、均時差與台灣歷年日光節約時間校正時柱（`lib/solarTime.ts`）
- **感情結構**：夫妻宮、配偶星、咸池桃花、未來十年流年訊號都由規則算出（`lib/love.ts`），AI 只負責寫，不自行編造干支
- **AI**：免費預覽用 `MOHENG_TEASER_MODEL`（便宜、每位留資者一次），付費報告用 `ANTHROPIC_MODEL`；角色語氣與安全規則在 `lib/moheng.ts` 的 `PERSONA`
- **誠實原則**：使用者自己說的事（感情狀態、煩惱），報告會寫「你說」，不會假裝是命盤看出來的
- **美術**：放進 `public/moheng/` 即自動顯示（`alley/table/lantern.webp` 背景、`idle/glance/writing/smile.webp` 立繪）；沒有圖時用 CSS 場景。角色設定與生圖需求見 `content/moheng.ts` 的 `ART_BRIEF`
- **價格**：`MOHENG_PRICE_TWD`（預設 990）。不要標示從未實際售出過的「原價」，以免違反價格標示規定
- **報表**：Supabase `product_daily_stats` 依角色看每日留資、付費、轉換率、營收
- **廣告追蹤**：Lead（留 Email）→ ViewContent（預覽頁）→ InitiateCheckout（按付款）→ Purchase

新增第二個角色時：複製 `content/moheng.ts` 改劇本，在 `lib/products.ts` 加一個商品代碼，頁面與 API 依樣複製即可共用排盤與金流。

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
- [ ] 已上線的專案請在 Supabase 重跑 `supabase/schema.sql`，補上角色漏斗的欄位
- [ ] 墨衡流程會收集 Email 與「想問的事」：隱私權政策要寫明蒐集目的、保存期限，以及行銷通知為選擇性同意
- [ ] 報告完成後寄 Email 通知尚未串接（需另接寄信服務，例如 Resend）

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
