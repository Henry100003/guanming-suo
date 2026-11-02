import { config } from "@/lib/config";

export const metadata = { title: `退款政策｜${config.brandName}` };

export default function Refund() {
  return (
    <article className="legal">
      <h1 style={{ marginTop: 32 }}>退款政策</h1>
      <p>詳批報告為付款後立即提供的數位內容，原則上不適用七日解除權。但下列情況我們會全額退款：</p>
      <ul>
        <li>重複付款或金額錯誤。</li>
        <li>付款成功後 24 小時內報告仍無法產生或無法開啟，且我們無法修復。</li>
        <li>出生資料輸入錯誤，且於付款後 24 小時內來信、尚未大量閱讀報告者，我們可改為以正確資料重新產生一次，或退款。</li>
      </ul>
      <p>此外，如果你對報告內容不滿意，可於付款後 7 日內來信說明，我們會個案審酌退款，不會要求你提供身分證字號或銀行帳戶以外的資料。</p>
      <h2>申請方式</h2>
      <p>請來信 <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>，附上訂單時間與命盤頁網址。我們會於 3 個工作天內回覆，核准後透過原信用卡刷退，實際入帳時間依發卡銀行作業而定。</p>
    </article>
  );
}
