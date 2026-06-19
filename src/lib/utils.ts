import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 合并 className，处理 Tailwind 冲突。shadcn 组件依赖此函数。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
