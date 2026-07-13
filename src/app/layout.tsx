"use client";

import type { Metadata, Viewport } from "next";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isFullscreenPage = pathname?.endsWith("/cook") || pathname?.endsWith("/shopping");

  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <title>灵感厨房 - 跟着做就会</title>
        <meta name="description" content="精选美食菜谱，跟着做就会" />
        <meta name="theme-color" content="#f5701f" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers>
          {!isFullscreenPage && <Navbar />}
          <div className={isFullscreenPage ? "" : "pt-14"}>{children}</div>
        </Providers>
      </body>
    </html>
  );
}
