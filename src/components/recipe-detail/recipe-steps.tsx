"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, Clock } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeStepsProps {
  recipe: Recipe;
}

export function RecipeSteps({ recipe }: RecipeStepsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  // 7秒自动切换步骤
  useEffect(() => {
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 100 / 70, 100)); // 7秒 = 7000ms，每100ms更新一次
    }, 100);

    const stepTimer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % recipe.steps.length);
    }, 7000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimer);
    };
  }, [currentStep, recipe.steps.length]);

  // 当步骤切换时，自动滚动到对应位置（仅在步骤列表容器内滚动）
  useEffect(() => {
    if (stepsContainerRef.current) {
      const stepElement = stepsContainerRef.current.children[currentStep] as HTMLElement;
      if (stepElement) {
        // 计算步骤元素在容器内的位置
        const container = stepsContainerRef.current;
        const stepTop = stepElement.offsetTop;
        const stepHeight = stepElement.offsetHeight;
        const containerHeight = container.clientHeight;
        const containerScrollTop = container.scrollTop;

        // 如果步骤不在可视区域内，则滚动到居中位置
        if (stepTop < containerScrollTop || stepTop + stepHeight > containerScrollTop + containerHeight) {
          container.scrollTo({
            top: stepTop - containerHeight / 2 + stepHeight / 2,
            behavior: "smooth",
          });
        }
      }
    }
  }, [currentStep]);

  // 手动切换步骤
  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setProgress(0);
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">制作步骤</h2>
      <div className="grid gap-4 overflow-hidden rounded-xl border border-border/60 bg-white p-4 lg:grid-cols-[1fr_1.4fr]" style={{ height: '60vh' }}>
        {/* 左：步骤图轮播 上下居中 */}
        <div className="flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <ChefHat className="mx-auto mb-2 h-20 w-20 text-primary/20" />
              <div className="text-sm text-muted-foreground">步骤 {currentStep + 1}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 右：步骤列表 固定高度可滚动 */}
        <div ref={stepsContainerRef} className="-mr-4 space-y-2 overflow-y-auto pr-4" style={{ height: 'calc(60vh - 2rem)' }}>
          {recipe.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => handleStepClick(i)}
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-all",
                i === currentStep
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/60 bg-white hover:border-primary/20 hover:bg-muted/20"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {step.index}
                </span>
                <span className="font-medium">{step.title}</span>
                {step.duration_sec && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {Math.ceil(step.duration_sec / 60)}min
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.instruction}</p>
              {step.produces && (
                <div className="mt-2 inline-block rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  产出: {step.produces}
                </div>
              )}
              {step.tips && step.tips.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {step.tips.map((tip, j) => (
                    <div key={j} className="text-xs text-primary">💡 {tip}</div>
                  ))}
                </div>
              )}

              {/* 进度条 - 仅在当前步骤显示 */}
              {i === currentStep && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
