import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link as RouterLink } from "react-router-dom";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  prefetch?: boolean;
  scroll?: boolean;
  replace?: boolean;
};

const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { href, prefetch: _prefetch, scroll: _scroll, replace, ...props }, ref,
) {
  if (!href.startsWith("/") || href.startsWith("//") || props.target === "_blank") {
    return <a ref={ref} href={href} {...props} />;
  }
  return <RouterLink ref={ref} to={href} replace={replace} {...props} />;
});

export default Link;
