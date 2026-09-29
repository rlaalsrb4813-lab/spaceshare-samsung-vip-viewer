import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpaceShare 삼성역센터 VIP 상담일지",
  description: "누적 매출 2,000만원 이상 업체를 위한 VIP 상담일지 뷰어",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
