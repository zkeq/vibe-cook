/**
 * 共享动效预设(motion / Framer Motion)
 * 全站统一的 spring 手感与过渡，避免各处硬编码。
 */
import type { Transition, Variants } from "motion/react";

/** 柔和弹性 — 卡片、按钮按下回弹 */
export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

/** 利落弹性 — 完成打勾、强正反馈 */
export const springPop: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 18,
};

/** 页面/卡片淡入上移 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: springSoft },
};

/** 列表逐项错落入场 */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/** 步骤左右滑切换(方向感) */
export const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 64 : -64 }),
  center: { opacity: 1, x: 0, transition: springSoft },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -64 : 64,
    transition: { duration: 0.2 },
  }),
};
