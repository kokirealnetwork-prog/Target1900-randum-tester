import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-numeric",
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-jp",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "tango random tester",
  description: "単語帳からランダムに単語テストを作ってPDFで印刷できます。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f7f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${googleSansFlex.variable} ${notoSansJp.variable}`}>
      <body>{children}</body>
    </html>
  );
}
