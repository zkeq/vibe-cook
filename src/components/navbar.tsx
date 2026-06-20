"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, BookOpen, Search } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useIntro } from "@/lib/intro-context";

const navItems = [
  { href: "/", label: "食谱", icon: BookOpen },
  { href: "/explore", label: "发现", icon: Search },
];

export function Navbar() {
  const pathname = usePathname();
  const { phase } = useIntro();
  const visible = phase === "app" || phase === "done";

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={visible ? { y: 0, opacity: 1 } : { y: -60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50 h-14 border-b border-border bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white shadow-sm">
            <ChefHat className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">Vibe Cook</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
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
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
