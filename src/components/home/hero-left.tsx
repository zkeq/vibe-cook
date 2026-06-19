"use client";

import { motion } from "motion/react";
import { ChefHat } from "lucide-react";

export function HeroLeft() {
  return (
    <div className="flex flex-shrink-0 flex-col items-center justify-center gap-4 lg:items-start">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="grid h-20 w-20 place-items-center rounded-[22px] bg-primary shadow-2xl shadow-primary/30"
      >
        <ChefHat className="h-10 w-10 text-white" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="flex flex-col items-center gap-0.5 lg:items-start"
      >
        <span className="text-2xl font-black tracking-tight text-foreground">Vibe Cook</span>
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">跟着做就会</span>
      </motion.div>
    </div>
  );
}
