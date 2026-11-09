import type { Metadata } from "next";
import Funnel from "@/components/moheng/Funnel";
import { MOHENG } from "@/content/moheng";

export const metadata: Metadata = {
  title: `${MOHENG.name}｜${MOHENG.title}・${MOHENG.theme}`,
  description: `「${MOHENG.cover.tagline}」夜市巷底的算命書生，用你的八字看感情。先看免費解讀。`,
  openGraph: { title: `${MOHENG.name}｜${MOHENG.theme}`, description: MOHENG.cover.tagline, locale: "zh_TW", type: "website" },
};

export default function MohengPage() {
  return <Funnel />;
}
