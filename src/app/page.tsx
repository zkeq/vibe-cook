"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { motion } from "motion/react";
import { useRecipeStore } from "@/store/recipe-store";
import recipeAPI from "@/services/recipe-api";
import type { RecipeSummary } from "@/lib/types";
import { DotBg }      from "@/components/home/dot-bg";
import { HeroLeft }   from "@/components/home/hero-left";
import { HeroRight }  from "@/components/home/hero-right";
import { FeatureBar } from "@/components/home/feature-bar";
import { Marquee }    from "@/components/home/marquee";
import { RecipeGrid } from "@/components/home/recipe-grid";
import { Pagination } from "@/components/ui/pagination";
import { useIntro }   from "@/lib/intro-context";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { phase } = useIntro();
  const { recipeList, fetchRecipeList, isLoading, currentPage, totalPages, setCurrentPage, totalRecipes } = useRecipeStore();
  const [marqueeRecipes, setMarqueeRecipes] = useState<RecipeSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const entered = phase === "app" || phase === "done";

  // 加载分类列表
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await recipeAPI.getCategories();
        setCategories(["全部", ...cats]);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // 页面加载时获取菜谱列表
  useEffect(() => {
    fetchRecipeList(1, selectedCategory === "全部" ? undefined : selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // 调试：打印 totalRecipes
  useEffect(() => {
    console.log('HomePage totalRecipes:', totalRecipes);
  }, [totalRecipes]);

  // 获取随机菜谱用于 Marquee
  useEffect(() => {
    const loadMarqueeData = async () => {
      try {
        const random = await recipeAPI.getRandomRecipes(48);
        setMarqueeRecipes(random);
      } catch (error) {
        console.error('Failed to load marquee recipes:', error);
      }
    };
    loadMarqueeData();
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
  };

  const fadeUp = (delay: number) =>
    entered
      ? { opacity: [0, 1] as number[], y: [40, 0] as number[] }
      : { opacity: 0 };

  const trans = (delay: number) => ({
    duration: 0.6,
    delay,
    ease: "easeOut" as const,
  });

  return (
    <main className="min-h-screen">
      <DotBg />

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={fadeUp(0.15)}
        transition={trans(0.15)}
        className="mx-auto max-w-5xl px-8 pb-4 pt-16"
      >
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
          <HeroLeft />
          <div className="hidden h-auto w-px self-stretch bg-border lg:block" />
          <HeroRight />
        </div>
      </motion.section>

      {/* 五条特性 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={fadeUp(0.28)}
        transition={trans(0.28)}
      >
        <FeatureBar />
      </motion.div>

      {/* 双行无限滚动 */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={fadeUp(0.38)}
        transition={trans(0.38)}
        className="border-y border-border bg-white/60 py-6 backdrop-blur-sm"
      >
        <div className="mb-4 flex items-center gap-2 px-6 lg:px-16">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">食谱一览</span>
          <span className="text-xs text-muted-foreground">
            — {totalRecipes} 道精选，持续更新
          </span>
        </div>
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            加载中...
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            <Marquee items={marqueeRecipes.length > 0 ? marqueeRecipes : recipeList} />
            <Marquee items={marqueeRecipes.length > 0 ? marqueeRecipes : recipeList} reverse />
          </div>
        )}
      </motion.section>

      {/* 食谱网格 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={fadeUp(0.48)}
        transition={trans(0.48)}
        className="pb-8"
      >
        <RecipeGrid
          items={recipeList}
          isLoading={isLoading}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          totalCount={totalRecipes}
        />

        {/* 分页器 */}
        {!isLoading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => fetchRecipeList(page, selectedCategory === "全部" ? undefined : selectedCategory)}
            className="mt-8"
          />
        )}
      </motion.div>
    </main>
  );
}
