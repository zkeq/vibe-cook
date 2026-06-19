"use client";

import { motion } from "motion/react";

const FEATURES = [
  { dot: "bg-emerald-400", num: "01", title: "全程分步引导",  sub: "操作说明 · 计时器 · 产出物提示，每步独立不跳不乱" },
  { dot: "bg-blue-400",   num: "02", title: "iPad 沉浸模式", sub: "全屏专注，屏幕常亮不休眠，灶台边轻松跟做" },
  { dot: "bg-amber-400",  num: "03", title: "完成正反馈",    sub: "每步庆祝动效，做完整道菜有成就感爆发" },
  { dot: "bg-violet-400", num: "04", title: "结构化食谱库",  sub: "原料 · 工具 · 份量 · 步骤 · 变体，信息密度极高" },
  { dot: "bg-rose-400",   num: "05", title: "份量自由缩放",  sub: "一人食 → 宴客，原料用量自动按比例换算" },
];

export function FeatureBar() {
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-5 px-6 pb-10 pt-2">
      {FEATURES.map(({ dot, num, title, sub }, i) => (
        <motion.div
          key={num}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 260, damping: 24 }}
          className="flex flex-col gap-1 pr-4"
        >
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{num}</span>
          </div>
          <p className="text-xs font-bold text-foreground">{title}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
