"use client";

import type { RecipeSummary } from "@/lib/types";
import { RecipeCard } from "./recipe-card";

interface Props {
  items: RecipeSummary[];
  reverse?: boolean;
}

const styleTag = `
@keyframes marquee-fwd { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
@keyframes marquee-bwd { 0% { transform: translateX(-50%) } 100% { transform: translateX(0) } }
`;

export function Marquee({ items, reverse = false }: Props) {
  // 只复制2倍，减少渲染元素
  const track = [...items, ...items];

  // 速度 30px/s，每个卡片约 200px
  // 时间 = (卡片数 * 200) / 30 = 卡片数 * 6.67
  const duration = Math.max(80, items.length * 6.67);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styleTag }} />
      <div className="overflow-hidden">
        <div
          className="flex w-max gap-3"
          style={{
            animation: `${reverse ? "marquee-bwd" : "marquee-fwd"} ${duration}s linear infinite`,
            willChange: 'transform'
          }}
        >
          {track.map((r, i) => (
            <RecipeCard key={`${r.id}-${i}`} recipe={r} />
          ))}
        </div>
      </div>
    </>
  );
}
