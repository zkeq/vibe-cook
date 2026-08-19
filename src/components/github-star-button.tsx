"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const GITHUB_REPO_URL = "https://github.com/zkeq/vibe-cook";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 4.84c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function GithubStarButton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub 开源，去点 Star"
      className={cn(
        "inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground",
        compact ? "text-xs" : "text-[13px]",
        className
      )}
    >
      <GithubMark className={compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} />
      <span>{compact ? "Star" : "开源 · Star"}</span>
      <Star className={cn("fill-current opacity-70", compact ? "h-3 w-3" : "h-3 w-3")} />
    </a>
  );
}
