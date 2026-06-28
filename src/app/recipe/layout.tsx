"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { mockRecipeList } from "@/lib/mock";
import { RecipeSidebar } from "@/components/recipe-detail";
import { Navbar } from "@/components/navbar";

export default function RecipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isCookPage = pathname ? pathname.endsWith("/cook") : false;
  const isShoppingPage = pathname ? pathname.endsWith("/shopping") : false;
  const isFullscreenPage = isCookPage || isShoppingPage;

  return (
    <>
      {/* 顶部导航栏 - 传入菜单控制 */}
      {!isFullscreenPage && (
        <Navbar
          showMenuButton={true}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
      )}

      <div className={isFullscreenPage ? "" : "-mt-14 min-h-screen flex pt-14"}>
        {/* 左侧导航 - 在 layout 层级，不会因为页面切换而重新挂载 */}
        {!isFullscreenPage && (
          <RecipeSidebar
            recipes={mockRecipeList}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            mobileOpen={mobileMenuOpen}
            onMobileOpenChange={setMobileMenuOpen}
          />
        )}

        {/* 主内容区 */}
        {children}
      </div>
    </>
  );
}
