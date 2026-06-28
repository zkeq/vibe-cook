"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import recipeAPI from "@/services/recipe-api";

const COPY_LINES = [
  { from: "「看完就忘」",   to: "「一步做出来」" },
  { from: "「只会外卖」",   to: "「自己下厨」" },
  { from: "「食谱收藏夹」", to: "「餐桌上的菜」" },
  { from: "「看着馋」",     to: "「跟着做就会」" },
  { from: "「不知做什么」", to: "「10分钟上桌」" },
];

function AnimatedCopy({ interval = 2800 }: { interval?: number }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % COPY_LINES.length), interval);
    return () => clearInterval(t);
  }, [interval]);
  const { from, to } = COPY_LINES[idx];
  return (
    <div className="overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.h2
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1 text-4xl font-black leading-snug tracking-tight text-foreground"
        >
          把{from}<br />
          变成<span className="text-primary">{to}</span>
        </motion.h2>
      </AnimatePresence>
    </div>
  );
}

export function HeroRight({ interval = 2800 }: { interval?: number }) {
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [avgSteps, setAvgSteps] = useState(5);

  // 获取统计数据
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/recipes/stats`);
        const data = await response.json();

        if (data.total) {
          setTotalRecipes(data.total);
        }
        if (data.avg_steps) {
          setAvgSteps(data.avg_steps);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    loadStats();
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.18, delayChildren: 0.6 } } }}
      className="flex w-full max-w-sm flex-col gap-0"
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="pb-4"
      >
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Step-by-step cooking</p>
        <AnimatedCopy interval={interval} />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mb-4 h-px bg-border" />

      <motion.div
        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        className="flex items-center gap-5 pb-4"
      >
        <div>
          <span className="text-5xl font-black text-foreground">{totalRecipes || 50}</span>
          <span className="ml-0.5 text-2xl font-black text-primary">+</span>
          <p className="text-xs text-muted-foreground">精选食谱</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <span className="text-5xl font-black text-foreground">{avgSteps}</span>
          <p className="text-xs text-muted-foreground">平均步数</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <span className="text-5xl font-black text-foreground">0</span>
          <p className="text-xs text-muted-foreground">基础要求</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
