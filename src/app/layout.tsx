import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Vibe Cook · 跟着做就会",
  description: "一步一步带你做饭，看着馋就动手。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vibe Cook",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5701f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // iPad 安全区
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
