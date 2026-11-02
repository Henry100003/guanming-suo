export const config = {
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || "命序",
  brandTagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || "看懂自己的命盤，走自己的節奏",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  priceTwd: Number(process.env.REPORT_PRICE_TWD || 299),
  productName: process.env.REPORT_PRODUCT_NAME || "八字詳批報告",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "service@example.com",
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "（請填入公司或行號名稱）",
  companyTaxId: process.env.NEXT_PUBLIC_COMPANY_TAX_ID || "（統一編號）",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
  allowMockPay: process.env.ALLOW_MOCK_PAY === "true",
};
