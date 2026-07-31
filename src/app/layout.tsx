import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "target1900tester-ver6",
  description: "ターゲット1900の単語からランダムに単語テストを作って印刷できます。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#fafafb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${notoSans.variable} ${notoSansJp.variable}`}>{children}</body>
    </html>
  );
}
