"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";
import { mockRecipeList } from "@/lib/mock";
import { DotBg }      from "@/components/home/dot-bg";
import { HeroLeft }   from "@/components/home/hero-left";
import { HeroRight }  from "@/components/home/hero-right";
import { FeatureBar } from "@/components/home/feature-bar";
import { Marquee }    from "@/components/home/marquee";
import { RecipeGrid } from "@/components/home/recipe-grid";
import { useIntro }   from "@/lib/intro-context";

const SECTION_VARIANTS = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { phase } = useIntro();
  const entered = phase === "app" || phase === "done";

  return (
    <main className="min-h-screen">
      <DotBg />

      {/* Hero */}
      <motion.section
        variants={SECTION_VARIANTS}
        initial="hidden"
        animate={entered ? "show" : "hidden"}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="mx-auto max-w-3xl px-6 pb-4 pt-16"
      >
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
          <HeroLeft />
          <div className="hidden h-auto w-px self-stretch bg-border lg:block" />
          <HeroRight />
        </div>
      </motion.section>

      {/* 五条特性 */}
      <motion.div
        variants={SECTION_VARIANTS}
        initial="hidden"
        animate={entered ? "show" : "hidden"}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
      >
        <FeatureBar />
      </motion.div>

      {/* 双行无限滚动 */}
      <motion.section
        variants={SECTION_VARIANTS}
        initial="hidden"
        animate={entered ? "show" : "hidden"}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.38 }}
        className="border-y border-border bg-white/60 py-6 backdrop-blur-sm"
      >
        <div className="mb-4 flex items-center gap-2 px-6 lg:px-16">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">食谱一览</span>
          <span className="text-xs text-muted-foreground">
            — {mockRecipeList.length} 道精选，持续更新
          </span>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <Marquee items={mockRecipeList} />
          <Marquee items={[...mockRecipeList].reverse()} reverse />
        </div>
      </motion.section>

      {/* 食谱网格 */}
      <motion.div
        variants={SECTION_VARIANTS}
        initial="hidden"
        animate={entered ? "show" : "hidden"}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.48 }}
      >
        <RecipeGrid items={mockRecipeList} />
      </motion.div>
    </main>
  );
}
