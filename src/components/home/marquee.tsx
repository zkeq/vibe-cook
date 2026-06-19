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
  const track = [...items, ...items, ...items, ...items];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styleTag }} />
      <div className="overflow-hidden">
        <div
          className="flex w-max gap-3"
          style={{ animation: `${reverse ? "marquee-bwd" : "marquee-fwd"} 80s linear infinite` }}
        >
          {track.map((r, i) => (
            <RecipeCard key={`${r.id}-${i}`} recipe={r} />
          ))}
        </div>
      </div>
    </>
  );
}
