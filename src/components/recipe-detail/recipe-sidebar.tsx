"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChefHat, Star, Search, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RecipeSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeSidebarProps {
  recipes: RecipeSummary[];
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function RecipeSidebar({
  recipes,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  mobileOpen: controlledMobileOpen,
  onMobileOpenChange
}: RecipeSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setCollapsed = onCollapsedChange || setInternalCollapsed;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [width, setWidth] = useState(240);
  const [tempWidth, setTempWidth] = useState(240);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileOpen = controlledMobileOpen !== undefined ? controlledMobileOpen : internalMobileOpen;
  const setMobileOpen = onMobileOpenChange || setInternalMobileOpen;
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // 从 localStorage 读取保存的宽度
  useEffect(() => {
    setMounted(true);
    const savedWidth = localStorage.getItem("recipe-sidebar-width");
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (!isNaN(parsedWidth)) {
        setWidth(parsedWidth);
        setTempWidth(parsedWidth);
      }
    }
  }, []);

  // 提取所有分类
  const categories = ["全部", ...Array.from(new Set(recipes.map((r) => r.category)))];

  // 过滤菜谱
  const filteredRecipes = recipes.filter((item) => {
    const matchCategory = selectedCategory === "全部" || item.category === selectedCategory;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 拖动处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = Math.max(180, Math.min(400, e.clientX));
      setTempWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setWidth(tempWidth); // 松开鼠标时才应用最终宽度
        localStorage.setItem("recipe-sidebar-width", tempWidth.toString()); // 保存到 localStorage
      }
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, tempWidth]);

  return (
    <>
      {/* 移动端遮罩 */}
      {mobileOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />,
        document.body
      )}

      {/* 侧边栏 */}
      <aside
        ref={sidebarRef}
        className={cn(
          "shrink-0 border-r border-border/60 bg-white transition-all duration-300",
          // 移动端：固定定位，从顶部栏下方开始，抽屉式
          "fixed left-0 top-14 h-[calc(100vh-3.5rem)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // 桌面端：粘性定位，正常显示
          "lg:sticky lg:translate-x-0 lg:self-start",
          collapsed && "lg:!w-12"
        )}
        style={{
          width: collapsed ? undefined : `${width}px`,
          zIndex: mobileOpen ? 45 : "auto",
        }}
      >
        <div className="flex h-full flex-col">
          {/* 顶部搜索栏 */}
          <div className={cn("flex h-11 shrink-0 items-center border-b border-border/60 bg-white", collapsed ? "justify-center px-1" : "gap-2 px-3")}>
            {/* 移动端关闭按钮 */}
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="关闭菜单"
            >
              <X className="h-4 w-4" />
            </button>

            {!collapsed && (
              <div className="group relative flex-1">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className="h-7 w-full rounded-md border border-border/60 bg-background pl-7 pr-2 text-xs outline-none transition-all placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:block"
              title={collapsed ? "展开" : "收起"}
            >
              {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>
          </div>

          {/* 分类标签栏 */}
          {!collapsed && (
            <div className="shrink-0 border-b border-border/60 bg-muted/20 px-2 py-1.5">
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
                      selectedCategory === cat
                        ? "bg-primary text-white"
                        : "bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 菜谱列表 - 表格式 */}
          <div className="flex-1 overflow-y-auto">
            {filteredRecipes.map((item, index) => {
              const active = pathname.includes(item.id);

              if (collapsed) {
                return (
                  <Link
                    key={item.id}
                    href={`/recipe/${item.id}`}
                    className={cn(
                      "flex h-10 items-center justify-center border-b border-border/60 transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted/40"
                    )}
                    title={item.title}
                  >
                    <ChefHat className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-muted-foreground")} />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={`/recipe/${item.id}`}
                  className={cn(
                    "flex items-start gap-3 border-b border-border/60 px-3 py-3 transition-colors",
                    active ? "bg-primary/5" : index % 2 === 0 ? "bg-white hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br",
                    active ? "from-primary/20 to-primary/10" : "from-orange-50 to-amber-50"
                  )}>
                    <ChefHat className={cn("h-3 w-3", active ? "text-primary" : "text-primary/30")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-xs font-bold leading-tight", active ? "text-primary" : "text-foreground")}>
                      {item.title}
                    </div>
                    {item.summary && (
                      <div className="mt-0.5 truncate text-[10px] leading-relaxed text-muted-foreground/70">{item.summary}</div>
                    )}
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">{item.category}</span>
                      <span>·</span>
                      <span>{item.duration_min}min</span>
                      <span>·</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.min(item.difficulty || 0, 5) }).map((_, i) => (
                          <Star key={i} className={cn("h-2 w-2", active ? "fill-primary text-primary" : "fill-amber-400 text-amber-400")} />
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 可拖动分割线 */}
        {!collapsed && (
          <div
            className={cn(
              "absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/30",
              isDragging && "bg-primary/50"
            )}
            onMouseDown={(e) => {
              setIsDragging(true);
              setTempWidth(width);
            }}
          />
        )}
      </aside>

      {/* 拖动时的预览线 - 通过 portal 渲染到 body */}
      {mounted && isDragging && !collapsed && createPortal(
        <div
          className="pointer-events-none fixed left-0 top-0 z-[9999] h-full w-0.5 bg-primary"
          style={{ left: `${tempWidth}px` }}
        />,
        document.body
      )}
    </>
  );
}
