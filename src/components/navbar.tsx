"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, BookOpen, Search, Menu } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useIntro } from "@/lib/intro-context";
import { useState } from "react";

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

  const isCookPage = pathname ? pathname.endsWith("/cook") : false;
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
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索菜谱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Nav links - 桌面端显示 */}
        <nav className="hidden items-center gap-1 lg:flex">
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
