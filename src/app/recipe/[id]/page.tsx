"use client";

import Link from "next/link";
import { use } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Play } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-6 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </Link>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4"
      >
        <motion.h1 variants={fadeUp} className="text-2xl font-bold">
          全解图占位
        </motion.h1>
        <motion.p variants={fadeUp} className="text-muted-foreground">
          食谱 ID：<code className="text-foreground">{id}</code>
          <br />
          阶段 1 会在这里渲染原料、工具、份量计算、步骤总览。
        </motion.p>

        <motion.div variants={fadeUp}>
          <Link
            href={`/recipe/${id}/cook`}
            className="inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition-transform active:scale-95"
          >
            <Play className="h-5 w-5" />
            开始做饭
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
