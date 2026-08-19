"use client";

import { Github, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const GITHUB_REPO_URL = "https://github.com/zkeq/vibe-cook";

export function GithubStarButton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub 开源，去点 Star"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1.5 text-xs font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-white active:scale-95",
          className
        )}
      >
        <Github className="h-3.5 w-3.5" />
        <Star className="h-3 w-3 fill-current" />
        <span className="hidden sm:inline">Star</span>
      </a>
    );
  }

  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:bg-accent active:scale-95",
        className
      )}
    >
      <Github className="h-4 w-4" />
      <span>GitHub 开源 · 点个 Star</span>
      <Star className="h-3.5 w-3.5 fill-current transition-transform group-hover:rotate-12" />
    </a>
  );
}
