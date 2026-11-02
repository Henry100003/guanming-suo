import BirthForm from "@/components/BirthForm";
import { config } from "@/lib/config";

const FAQ = [
  { q: "免費排盤包含什麼？", a: "四柱八字、十神、藏干、十二長生、納音、五行分布、身強弱、喜用五行、大運與今年流年主題，全部免費查看。" },
  { q: "詳批報告和免費命盤差在哪？", a: `詳批報告約 3,000 字，依你的命盤逐章解讀性格天賦、事業財運、感情人際、身心節奏、十年大運與今年流年，並給出具體行動建議。一次付費 NT$${config.priceTwd}，可永久回看。` },
  { q: "付費之後還會被推銷其他東西嗎？", a: "不會。本站只有一項付費商品，不販售法會、點燈、符咒或任何「化解」服務，也不會私訊推銷。" },
  { q: "不知道出生時辰可以算嗎？", a: "可以。系統會排出年、月、日三柱，解讀仍然有參考價值，只是少了時柱所代表的晚年與子女面向。" },
  { q: "我的資料安全嗎？", a: "生日資料只用於排盤與產生報告，不會出售或提供給第三方行銷。你可以隨時來信要求刪除。" },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">八字命盤 ・ 免費排盤</div>
        <h1>看懂你的命盤，<br />走自己的節奏</h1>
        <p className="lead">輸入國曆生日，依節氣精準排出四柱八字，看見你的五行結構、天賦傾向與十年大運。</p>
        <div className="card accent">
          <BirthForm />
        </div>
      </section>

      <section className="card">
        <h2>你會看到</h2>
        <ul className="check-list">
          <li>依二十四節氣換月、子初換日的精準四柱</li>
          <li>五行強弱分布與身強身弱判斷</li>
          <li>喜用五行對應的顏色、方位與適合領域</li>
          <li>每十年一步的大運，與今年流年主題</li>
        </ul>
        <p className="muted">命理是認識自己的一種語言，不是宿命。我們只描述傾向，不製造焦慮。</p>
      </section>

      <section className="card">
        <h2>常見問題</h2>
        {FAQ.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
