import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "식약처 레시피 - 음식 레시피 및 영양 정보",
  description: "식품의약품안전처 레시피 API를 활용한 음식 레시피 및 영양 성분 정보 제공",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

