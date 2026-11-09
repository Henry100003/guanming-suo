// 商品設定：每個角色（漏斗）是一個商品，共用同一套排盤、資料表與綠界金流。
import { config } from "./config";

export type ProductCode = "classic" | "moheng";

export interface Product {
  code: ProductCode;
  name: string; // 綠界交易品名、報告標題
  priceTwd: number;
  /** 免費頁路徑 */
  pagePath: (id: string) => string;
  /** 付費報告路徑 */
  reportPath: (id: string) => string;
}

export const PRODUCTS: Record<ProductCode, Product> = {
  classic: {
    code: "classic",
    name: config.productName,
    priceTwd: config.priceTwd,
    pagePath: (id) => `/r/${id}`,
    reportPath: (id) => `/r/${id}/report`,
  },
  moheng: {
    code: "moheng",
    name: process.env.MOHENG_PRODUCT_NAME || "墨衡・戀愛八字詳批",
    priceTwd: Number(process.env.MOHENG_PRICE_TWD || 990),
    pagePath: (id) => `/m/${id}`,
    reportPath: (id) => `/m/${id}/report`,
  },
};

export function productOf(r: { product?: string | null } | null | undefined): Product {
  return PRODUCTS[(r?.product as ProductCode) ?? "classic"] ?? PRODUCTS.classic;
}
