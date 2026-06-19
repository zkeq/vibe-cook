"use client";

import Link from "next/link";
import { use, useEffect } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { requestWakeLock, releaseWakeLock, reacquireOnVisible } from "@/lib/wake-lock";

export default function CookModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // 进入烹饪模式：屏幕常亮；离开释放
  useEffect(() => {
    void requestWakeLock();
    const cleanup = reacquireOnVisible();
    return () => {
      cleanup();
      void releaseWakeLock();
    };
  }, []);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Link
        href={`/recipe/${id}`}
        className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground active:scale-90"
        aria-label="退出烹饪模式"
      >
        <X className="h-5 w-5" />
      </Link>

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <h1 className="text-3xl font-bold">烹饪模式占位</h1>
        <p className="mt-3 text-muted-foreground">
          食谱 ID：<code className="text-foreground">{id}</code>
          <br />
          阶段 1：全屏单步引导、进度条、计时器、完成打勾。
          <br />
          屏幕常亮已在本页生效（iPad Safari 支持时）。
        </p>
      </motion.div>
    </main>
  );
}
