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
        <title>Vibe Cook - 跟着做就会</title>
        <meta name="description" content="精选美食菜谱，跟着做就会" />
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
