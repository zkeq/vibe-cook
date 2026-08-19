"use client";

import { motion } from "motion/react";
import { ChefHat } from "lucide-react";
import { GithubStarButton } from "@/components/github-star-button";

export function HeroLeft() {
  return (
    <div className="flex flex-shrink-0 flex-col items-center justify-center gap-4 lg:items-start">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20, delay: 0.1 }}
        className="grid h-28 w-28 place-items-center rounded-[28px] bg-primary shadow-2xl shadow-primary/30"
      >
        <ChefHat className="h-14 w-14 text-white" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="flex flex-col items-center gap-1 lg:items-start"
      >
        <span className="text-4xl font-black tracking-tight text-foreground">Vibe Cook</span>
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">跟着做就会</span>
        <GithubStarButton className="mt-2" />
      </motion.div>
    </div>
  );
}
