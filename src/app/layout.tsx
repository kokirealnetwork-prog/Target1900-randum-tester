import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex } from "next/font/google";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-numeric",
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
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
  themeColor: "#fafafb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {[400, 500, 600, 700].map((weight) => (
          <link
            key={weight}
            rel="stylesheet"
            href={`https://cdn.jsdelivr.net/npm/gen-interface-jp@0.8.0/cdn/${weight}.css`}
          />
        ))}
      </head>
      <body className={googleSansFlex.variable}>{children}</body>
    </html>
  );
}
