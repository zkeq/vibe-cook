import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { isMyGo } from "mygo-runtime";
import { Providers } from "@/app/providers";
import { Navbar } from "@/components/navbar";
import HomePage from "@/app/page";
import RecipeLayout from "@/app/recipe/layout";
import RecipePage from "@/app/recipe/[id]/page";
import CookPage from "@/app/recipe/[id]/cook/page";
import ShoppingPage from "@/app/recipe/[id]/shopping/page";
import "./styles.css";

function NativeLifecycle() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const back = App.addListener("backButton", () => {
      if (pathname !== "/") navigate(-1);
      else void App.exitApp();
    });
    const open = App.addListener("appUrlOpen", ({ url }) => {
      const link = new URL(url);
      if (link.hostname === "cook.corerevive.cn") navigate(link.pathname + link.search);
    });
    return () => { void back.then((handle) => handle.remove()); void open.then((handle) => handle.remove()); };
  }, [navigate, pathname]);
  return null;
}

function RecipeFrame() {
  const { pathname } = useLocation();
  const fullScreen = /\/(cook|shopping)$/.test(pathname);
  return <>{fullScreen && isMyGo() && <div className="native-window-strip" />}<div className={fullScreen ? "" : "pt-14"}><RecipeLayout><Outlet /></RecipeLayout></div></>;
}

function ClientApp() {
  return <BrowserRouter><Providers>
    <NativeLifecycle />
    <Routes>
      <Route path="/" element={<><Navbar /><div className="pt-14"><HomePage /></div></>} />
      <Route path="/recipe" element={<RecipeFrame />}>
        <Route path=":id" element={<RecipePage />} />
        <Route path=":id/cook" element={<CookPage />} />
        <Route path=":id/shopping" element={<ShoppingPage />} />
      </Route>
      <Route path="*" element={<main className="flex min-h-screen items-center justify-center"><Link to="/">页面不存在，返回首页</Link></main>} />
    </Routes>
  </Providers></BrowserRouter>;
}

if (isMyGo()) document.documentElement.dataset.desktop = "true";
createRoot(document.getElementById("root")!).render(<ClientApp />);
