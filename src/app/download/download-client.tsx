"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDown, ArrowRight, Check, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { DotBg } from "@/components/home/dot-bg";
import { AndroidMark, AppleMark, WindowsMark } from "@/components/download/platform-icons";
import {
  CNB_RELEASES_URL,
  GITHUB_RELEASES_URL,
  PLATFORM_FILES,
  detectPlatform,
  formatSize,
  type PlatformId,
  type ReleaseAsset,
  type ReleaseInfo,
} from "@/lib/releases";

interface PlatformMeta {
  id: PlatformId;
  name: string;
  Icon: (props: { className?: string }) => React.ReactNode;
  requirement: string;
  format: string;
  caution?: string;
  steps: string[];
}

const PLATFORMS: PlatformMeta[] = [
  {
    id: "macos",
    name: "macOS",
    Icon: AppleMark,
    requirement: "macOS 12+ · Apple 芯片 / Intel 通用",
    format: "DMG",
    steps: [
      "打开 .dmg，将 Vibe Cook 拖入「应用程序」",
      "首次打开提示「无法验证开发者」：系统设置 › 隐私与安全性 › 仍要打开",
      "应用暂未经 Apple 公证，仅首次需要确认",
    ],
  },
  {
    id: "windows",
    name: "Windows",
    Icon: WindowsMark,
    requirement: "Windows 10 / 11 · x64",
    format: "EXE 安装程序",
    steps: [
      "运行安装程序，按提示完成安装",
      "SmartScreen 拦截时：更多信息 › 仍要运行",
      "安装包暂未签名，仅首次需要确认",
    ],
  },
  {
    id: "android",
    name: "Android",
    Icon: AndroidMark,
    requirement: "Android 7.0+",
    format: "APK",
    steps: [
      "在手机浏览器中下载 APK",
      "按提示允许「安装未知应用」",
      "语音朗读依赖系统中文语音包，缺失时 App 内会提示",
    ],
  },
  {
    id: "ios",
    name: "iOS / iPadOS",
    Icon: AppleMark,
    requirement: "iOS 16.4+",
    format: "IPA（未签名）",
    caution: "需自签名",
    steps: [
      "IPA 未签名，需使用自己的 Apple 开发者证书签名后安装",
      "Xcode 用户可下载 Xcode Archive，选择自己的团队导出",
      "免安装：Safari 打开网页版 › 分享 › 添加到主屏幕",
    ],
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

const noopSubscribe = () => () => {};

function findAsset(assets: ReleaseAsset[], pattern: RegExp) {
  return assets.find((a) => pattern.test(a.name));
}

export default function DownloadClient({ release }: { release: ReleaseInfo }) {
  // 设备只在客户端识别；服务端渲染时为 null
  const detected = useSyncExternalStore<PlatformId | "other" | null>(noopSubscribe, detectPlatform, () => null);
  const [pickedGuide, setGuide] = useState<PlatformId | null>(null);
  const guide = pickedGuide ?? (detected && detected !== "other" ? detected : "macos");

  useEffect(() => {
    document.title = "下载客户端 - Vibe Cook";
  }, []);

  const current = PLATFORMS.find((p) => p.id === detected);
  const currentAsset = current && findAsset(release.assets, PLATFORM_FILES[current.id].primary);
  // 首屏展示的安装包大小：当前设备的，未识别时取各平台中最小的
  const heroSize = Math.round(
    (currentAsset?.size ??
      Math.min(...PLATFORMS.map((p) => findAsset(release.assets, PLATFORM_FILES[p.id].primary)?.size ?? Infinity))) /
      1024 /
      1024
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden pb-16">
      <DotBg />

      {/* Hero：与首页同构（左图标 · 分隔线 · 右文案），铺满首屏并居中 */}
      <section className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-6xl items-center px-8 py-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_1px_1.35fr] lg:gap-16">
          <div className="relative flex flex-col items-center justify-center gap-5 lg:justify-self-center">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-20 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"
            />
            <motion.img
              src="/icon-512.png"
              alt="Vibe Cook"
              width={160}
              height={160}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 20, delay: 0.1 }}
              className="h-32 w-32 rounded-[32px] shadow-2xl shadow-primary/30 lg:h-40 lg:w-40 lg:rounded-[40px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-4xl font-black tracking-tight text-foreground">Vibe Cook</span>
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">客户端下载</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="mt-3 flex w-full flex-col items-center lg:items-start"
            >
              <div className="mb-5 h-px w-full bg-border" />
          <div className="flex items-center gap-5 text-left">
            <div>
              <span className="text-4xl font-black text-foreground">{PLATFORMS.length}</span>
              <p className="text-xs text-muted-foreground">支持平台</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="text-4xl font-black text-foreground">{heroSize}</span>
              <span className="ml-0.5 text-lg font-black text-primary">MB</span>
              <p className="text-xs text-muted-foreground">安装包大小</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="text-4xl font-black text-foreground">{release.version.replace(/^v/, "")}</span>
              <p className="text-xs text-muted-foreground">最新版本</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 lg:justify-start">
            <span className="text-xs text-muted-foreground">可用平台</span>
            <div className="flex items-center gap-1.5">
              {PLATFORMS.map(({ id, name, Icon }) => (
                <a
                  key={id}
                  href="#platforms"
                  title={name}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg border transition-colors",
                    id === detected
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-white/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
            </motion.div>
          </div>

          <div className="hidden h-auto w-px self-stretch bg-border lg:block" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            className="flex w-full max-w-xl flex-col items-center justify-self-center text-center lg:items-start lg:justify-self-start lg:text-left"
          >
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Download · {release.version}
            </p>
            <h1 className="mt-2 text-4xl font-black leading-snug tracking-tight text-foreground sm:text-5xl">
              把「跟着做就会」
              <br />
              带进<span className="text-primary">「厨房」</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              分步引导 · 计时器 · 语音朗读 · 屏幕常亮，macOS、Windows、Android、iOS 四端可用。
            </p>

            <div className="my-6 h-px w-full bg-border" />

            <div className="flex min-h-[3.25rem] flex-wrap items-center justify-center gap-3 lg:justify-start">
              {current && currentAsset ? (
                <a
                  href={currentAsset.url}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  <current.Icon className="h-4 w-4" />
                  下载 {current.name} 版
                </a>
              ) : (
                detected !== null && (
                  <a
                    href="#platforms"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
                  >
                    选择你的平台
                    <ArrowDown className="h-4 w-4" />
                  </a>
                )
              )}
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-6 py-3.5 text-base font-bold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                打开网页版
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-3 min-h-4 text-xs text-muted-foreground">
              {current && currentAsset ? (
                <>
                  {formatDate(release.publishedAt)}发布 · {current.format} · {formatSize(currentAsset.size)}
                  {current.caution && <span className="text-accent"> · {current.caution}</span>}
                </>
              ) : (
                detected === "other" && "当前系统暂无客户端，可直接使用网页版"
              )}
            </p>

          </motion.div>
        </div>

        <a
          href="#tour"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          所有平台
          <ArrowDown className="h-3.5 w-3.5" />
        </a>
      </section>

      {/* 平台列表 */}
      <section id="platforms" className="mx-auto mt-16 max-w-6xl scroll-mt-20 px-6">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-foreground">所有平台</h2>
              <span className="text-xs text-muted-foreground">{PLATFORMS.length} 端</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {current ? (
                <>当前设备：<span className="font-semibold text-primary">{current.name}</span></>
              ) : (
                "选择对应平台的安装包"
              )}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">CNB 加速下载 · GitHub 镜像</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORMS.map((platform, i) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              release={release}
              highlighted={platform.id === detected}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* 安装指引 */}
      <section className="mx-auto mt-16 max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-sm lg:col-span-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">安装说明</span>
            <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
              {PLATFORMS.map(({ id, name }) => (
                <button
                  key={id}
                  onClick={() => setGuide(id)}
                  className={cn(
                    "relative rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                    guide === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {guide === id && (
                    <motion.span
                      layoutId="guide-tab"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{id === "ios" ? "iOS" : name}</span>
                </button>
              ))}
            </div>
            <motion.ol
              key={guide}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
              className="mt-5 flex flex-col gap-4"
            >
              {PLATFORMS.find((p) => p.id === guide)!.steps.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/80">{step}</span>
                </li>
              ))}
            </motion.ol>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-sm">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">注意事项</span>
              <ul className="mt-3 flex flex-col gap-2.5 text-sm text-foreground/80">
                <li>菜谱与 AI 功能需联网使用</li>
                <li>
                  下载源：CNB（默认）·{" "}
                  <a href={GITHUB_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    GitHub 镜像
                  </a>
                </li>
                <li>
                  历史版本：
                  <a href={CNB_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    CNB Releases
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 更新日志 */}
      {release.notes && (
        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">更新日志 · {release.version}</span>
              <span className="text-xs text-muted-foreground">{formatDate(release.publishedAt)}</span>
            </div>
            <div className="mt-4 max-w-3xl text-sm leading-relaxed text-foreground/80 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.notes}</ReactMarkdown>
            </div>
          </div>
        </section>
      )}

      {/* 底部 CTA */}
      <section className="mx-auto mt-16 max-w-6xl px-6">
        <div className="flex flex-col gap-3 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>不想安装？网页版功能一致，打开即用。</p>
          <Link href="/" className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary/80">
            打开网页版
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function PlatformCard({
  platform,
  release,
  highlighted,
  index,
}: {
  platform: PlatformMeta;
  release: ReleaseInfo;
  highlighted: boolean;
  index: number;
}) {
  const files = PLATFORM_FILES[platform.id];
  const asset = findAsset(release.assets, files.primary);
  const extras = files.extras
    .map((extra) => ({ ...extra, asset: findAsset(release.assets, extra.pattern) }))
    .filter((extra) => extra.asset);
  const [copied, setCopied] = useState(false);

  const copySha = async () => {
    if (!asset?.sha256) return;
    try {
      await navigator.clipboard.writeText(asset.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // 剪贴板不可用时静默失败
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + index * 0.06, type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "relative flex flex-col rounded-[var(--radius)] border bg-white p-5 transition-shadow",
        highlighted
          ? "order-first border-primary shadow-[var(--shadow-float)] sm:order-none"
          : "border-border shadow-sm hover:shadow-[var(--shadow-float)]"
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl transition-colors",
            highlighted ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-foreground"
          )}
        >
          <platform.Icon className="h-6 w-6" />
        </span>
        {highlighted ? (
          <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">当前设备</span>
        ) : (
          platform.caution && (
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">{platform.caution}</span>
          )
        )}
      </div>

      <h3 className="mt-4 text-lg font-bold text-foreground">{platform.name}</h3>
      <div className="mt-3 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">系统要求 / Requires</p>
        <p className="mt-0.5 text-xs text-foreground">{platform.requirement}</p>
      </div>

      {asset ? (
        <>
          <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{platform.format}</span>
            <span className="tabular-nums">{formatSize(asset.size)}</span>
          </div>
          <a
            href={asset.url}
            className={cn(
              "mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-[0.98]",
              highlighted
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90"
                : "border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            )}
          >
            <Download className="h-4 w-4" />
            下载
          </a>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {extras.map(({ label, asset: extraAsset }) => (
              <a key={label} href={extraAsset!.url} className="transition-colors hover:text-primary">
                {label}
              </a>
            ))}
            <a href={asset.mirrorUrl} className="transition-colors hover:text-primary">
              GitHub 镜像
            </a>
            {asset.sha256 && (
              <button
                onClick={copySha}
                title={asset.sha256}
                className="inline-flex items-center gap-1 transition-colors hover:text-primary"
              >
                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                {copied ? "已复制" : "SHA-256"}
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="mt-5 text-xs text-muted-foreground">这个平台暂时还没有安装包</p>
      )}
    </motion.div>
  );
}
