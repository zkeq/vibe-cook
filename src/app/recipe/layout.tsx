"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { mockRecipeList } from "@/lib/mock";
import { RecipeSidebar } from "@/components/recipe-detail";

export default function RecipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isCookPage = pathname ? pathname.endsWith("/cook") : false;

  return (
    <div className={`-mt-14 min-h-screen ${isCookPage ? "" : "flex pt-14"}`}>
      {/* 左侧导航 - 在 layout 层级，不会因为页面切换而重新挂载 */}
      {!isCookPage && (
        <RecipeSidebar
          recipes={mockRecipeList}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      )}

      {/* 主内容区 */}
      {children}
    </div>
  );
}
