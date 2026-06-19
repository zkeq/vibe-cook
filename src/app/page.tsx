"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChefHat, ArrowRight } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-6 py-12">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
            <ChefHat className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vibe Cook</h1>
            <p className="text-sm text-muted-foreground">跟着做就会</p>
          </div>
        </motion.div>

        <motion.p variants={fadeUp} className="text-muted-foreground">
          食谱墙占位 — 阶段 1 会在这里渲染卡片网格。先打通脚手架与路由。
        </motion.p>

        <motion.div variants={fadeUp}>
          <Link
            href="/recipe/xihongshi-chaodan"
            className="inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-primary px-5 py-3 font-medium text-primary-foreground shadow-[var(--shadow-card)] transition-transform active:scale-95"
          >
            查看示例食谱
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
