import { config } from "@/lib/config";

export const metadata = { title: `服務條款｜${config.brandName}` };

export default function Terms() {
  return (
    <article className="legal">
      <h1 style={{ marginTop: 32 }}>服務條款</h1>
      <p className="muted">最後更新：請於上線前填入日期</p>

      <h2>一、服務內容</h2>
      <p>本站由{config.companyName}（統一編號 {config.companyTaxId}）經營，提供免費八字排盤，以及付費「{config.productName}」（NT${config.priceTwd}，含稅）。詳批報告由系統依命盤規則分析並以 AI 輔助撰寫，付款後立即於網頁提供，可永久回看。</p>

      <h2>二、內容性質</h2>
      <p>命理內容屬傳統文化與自我探索之參考，不保證任何結果，亦不構成醫療、心理治療、法律、投資或其他專業建議。重大決定請諮詢相關專業人士。</p>

      <h2>三、付款</h2>
      <p>付款由綠界科技股份有限公司處理。完成付款後，系統會自動解鎖報告。電子發票將依法開立。</p>

      <h2>四、解除權與退款</h2>
      <p>本商品屬「非以有形媒介提供之數位內容」，於付款前經你勾選同意後立即提供，依《通訊交易解除權合理例外情事適用準則》第二條第五款，不適用七日解除權。但如有重複扣款、報告無法產生等情形，請參閱 <a href="/refund">退款政策</a>。</p>

      <h2>五、使用規範</h2>
      <p>報告內容僅供個人使用，請勿大量重製或作商業用途。請勿以自動化方式大量存取本站。</p>

      <h2>六、服務變更與責任限制</h2>
      <p>本站得因維護或不可抗力暫停服務。在法律允許範圍內，本站對因使用命理內容所作決定產生之損失不負賠償責任，但本站有故意或重大過失者不在此限。</p>

      <h2>七、準據法</h2>
      <p>本條款以中華民國法律為準據法，並以臺灣臺北地方法院為第一審管轄法院（請依公司所在地調整）。</p>

      <h2>八、聯絡方式</h2>
      <p><a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></p>
    </article>
  );
}
