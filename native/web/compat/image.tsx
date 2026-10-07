import type { ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string; width?: number; height?: number };
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
};

export default function Image({
  src, alt = "", fill, priority, quality: _quality, placeholder: _placeholder,
  blurDataURL: _blurDataURL, unoptimized: _unoptimized, style, ...props
}: Props) {
  return <img {...props} alt={alt} src={typeof src === "string" ? src : src.src}
    loading={priority ? "eager" : (props.loading || "lazy")}
    decoding="async" fetchPriority={priority ? "high" : "auto"}
    style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style} />;
}
