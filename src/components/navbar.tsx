"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChefHat, BookOpen, Search, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useIntro } from "@/lib/intro-context";
import { useState, useEffect, useRef } from "react";
import recipeAPI from "@/services/recipe-api";
import type { RecipeSummary } from "@/lib/types";
import { RecipeFinderAgent } from "@/components/home/recipe-finder-agent";

const navItems = [
  { href: "/", label: "食谱", icon: BookOpen },
  { href: "/explore", label: "发现", icon: Search },
];

interface NavbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Navbar({ onMenuClick, showMenuButton = false }: NavbarProps = {}) {
  const pathname = usePathname();
  const { phase } = useIntro();
  const visible = phase === "app" || phase === "done";
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecipeSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isCookPage = pathname ? pathname.endsWith("/cook") : false;

  // 搜索防抖
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await recipeAPI.searchRecipes(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 点击外部关闭结果
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isCookPage) return null;

  return (
    <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    className="fixed inset-x-0 top-0 z-50 h-14 border-b border-border bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white shadow-sm">
            <ChefHat className="h-4 w-4" />
          </span>
          <span className="hidden text-base font-bold tracking-tight sm:inline">Vibe Cook</span>
        </Link>

        {/* 搜索框 */}
        <div ref={searchRef} className="relative flex max-w-md flex-1">
          <div className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索菜谱..."
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                if (!value.trim()) {
                  setSearchResults([]);
                  setShowResults(false);
                }
              }}
              onFocus={() => searchQuery && setShowResults(true)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {isSearching && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>

          {/* 搜索结果下拉 */}
          <AnimatePresence>
            {showResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-lg border border-border bg-white shadow-lg"
              >
                {searchResults.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.id}`}
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery("");
                    }}
                    className="flex items-start gap-3 border-b border-border p-3 transition-colors hover:bg-muted/50 last:border-b-0"
                  >
                    {recipe.cover_image ? (
                      <Image
                        src={recipe.cover_image}
                        alt={recipe.title}
                        width={48}
                        height={48}
                        className="shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-gradient-to-br from-orange-50 to-amber-50">
                        <ChefHat className="h-5 w-5 text-primary/30" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{recipe.title}</div>
                      {recipe.summary && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{recipe.summary}</div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">{recipe.category}</div>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav links - 桌面端显示 */}
        <nav className="hidden items-center gap-1 lg:flex">
          {pathname === "/" && <RecipeFinderAgent />}
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 移动端菜单按钮 */}
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted hover:text-foreground active:scale-95 lg:hidden"
            aria-label="打开菜单"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">菜单</span>
          </button>
        )}
      </div>
    </motion.header>
  );
}
