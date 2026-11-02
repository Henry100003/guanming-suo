import { config } from "@/lib/config";

export const metadata = { title: `隱私權政策｜${config.brandName}` };

export default function Privacy() {
  return (
    <article className="legal">
      <h1 style={{ marginTop: 32 }}>隱私權政策</h1>
      <p className="muted">最後更新：請於上線前填入日期</p>
      <p>{config.companyName}（以下稱「本站」）依《個人資料保護法》說明我們如何蒐集、處理及利用你的個人資料。</p>

      <h2>一、蒐集目的</h2>
      <p>提供八字排盤、命理報告產生、交易與客戶服務（法定特定目的代號：〇九〇 消費者、客戶管理與服務；一四八 網路購物及其他電子商務服務；一八一 其他經營合於營業登記項目所需）。</p>

      <h2>二、蒐集項目</h2>
      <ul>
        <li>你填寫的姓名或暱稱、性別、出生年月日與時間。</li>
        <li>交易資料：訂單編號、金額、付款狀態與付款方式類別。信用卡資料由綠界科技直接處理，本站不接觸也不儲存卡號。</li>
        <li>技術資料：廣告來源參數（如 utm）、瀏覽器與裝置資訊、Cookie 與 Meta Pixel 等分析工具所收集的使用行為。</li>
      </ul>

      <h2>三、利用期間、地區、對象及方式</h2>
      <p>資料保存至你要求刪除，或本站停止營運為止；交易紀錄依稅法保存期限保存。資料儲存於本站委託之雲端服務（Supabase、Vercel），並可能傳送至 AI 服務供應商（Anthropic）以產生報告內容，傳送內容僅限命盤資料與稱呼。本站不會出售或出租你的個人資料。</p>

      <h2>四、你的權利</h2>
      <p>你可以來信 <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a> 請求查詢、閱覽、複製、補充、更正、停止蒐集處理利用或刪除你的個人資料。拒絕提供出生資料將無法使用排盤服務。</p>

      <h2>五、Cookie 與廣告追蹤</h2>
      <p>本站使用 Cookie 及 Meta Pixel 衡量廣告成效。你可以透過瀏覽器設定拒絕 Cookie，或於 Facebook 廣告偏好設定中管理廣告追蹤。</p>

      <h2>六、資料安全</h2>
      <p>命盤頁面以不可猜測的專屬網址存取，請勿任意分享。我們以加密連線傳輸資料，並限制內部存取權限。</p>

      <h2>七、政策修訂</h2>
      <p>本政策如有修訂，將公告於本頁。</p>
    </article>
  );
}
