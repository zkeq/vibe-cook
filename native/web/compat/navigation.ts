import { useMemo } from "react";
import { useLocation, useNavigate, useParams as useRouteParams, useSearchParams as useRouteSearchParams } from "react-router-dom";

export function usePathname() { return useLocation().pathname; }
export function useSearchParams() { return useRouteSearchParams()[0]; }
export function useParams() { return useRouteParams(); }

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(() => ({
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: () => Promise.resolve(),
  }), [navigate]);
}
