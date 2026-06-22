"use client";

import { useState } from "react";
import { ChefHat, Star, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RecipeSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeSidebarProps {
  recipes: RecipeSummary[];
}

export function RecipeSidebar({ recipes }: RecipeSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const filteredRecipes = recipes.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={cn(
        "relative z-10 hidden shrink-0 border-r border-border/60 bg-white transition-all duration-300 lg:block",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn("flex h-14 shrink-0 items-center border-b border-border/60 bg-white", collapsed ? "justify-center px-2" : "gap-3 px-4")}>
          {!collapsed && (
            <div className="group relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索菜谱..."
                className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:shadow-sm"
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={collapsed ? "展开" : "收起"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {filteredRecipes.map((item) => {
              const active = pathname.includes(item.id);

              if (collapsed) {
                return (
                  <Link
                    key={item.id}
                    href={`/recipe/${item.id}`}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                      active ? "bg-primary/10 shadow-sm" : "hover:bg-muted/60"
                    )}
                    title={item.title}
                  >
                    <ChefHat className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={`/recipe/${item.id}`}
                  className={cn(
                    "group block overflow-hidden rounded-2xl border transition-all",
                    active
                      ? "border-primary/20 bg-primary/5 shadow-sm"
                      : "border-border bg-white hover:border-primary/30 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br transition-transform group-hover:scale-105",
                      active ? "from-primary/20 to-primary/10" : "from-orange-50 to-amber-50"
                    )}>
                      <ChefHat className={cn("h-5 w-5", active ? "text-primary" : "text-primary/30")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={cn("truncate text-sm font-semibold", active ? "text-primary" : "text-foreground")}>
                        {item.title}
                      </div>
                      {item.summary && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.summary}</div>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: Math.min(item.difficulty || 0, 5) }).map((_, i) => (
                            <Star key={i} className={cn("h-2.5 w-2.5", active ? "fill-primary text-primary" : "fill-amber-400 text-amber-400")} />
                          ))}
                        </div>
                        {item.duration_min && (
                          <span className="text-xs text-muted-foreground">· {item.duration_min}min</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
