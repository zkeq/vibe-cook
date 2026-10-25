"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDown, ArrowRight, Check, Copy, Download, ExternalLink, Globe, ShieldCheck, Sparkles } from "lucide-react";
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
  pitch: string;
  caution?: string;
  steps: string[];
}

const PLATFORMS: PlatformMeta[] = [
  {
    id: "macos",
    name: "macOS",
    Icon: AppleMark,
    requirement: "macOS 12 及以上 · Apple 芯片与 Intel 通用",
    format: "DMG",
    pitch: "标题栏融入页面，保留原生窗口按钮，大屏跟做更从容。",
    steps: [
      "打开下载好的 .dmg，把 Vibe Cook 拖进「应用程序」文件夹。",
      "首次打开如提示“无法验证开发者”，前往「系统设置 › 隐私与安全性」，点「仍要打开」。",
      "之后从启动台或程序坞直接打开即可。",
    ],
  },
  {
    id: "windows",
    name: "Windows",
    Icon: WindowsMark,
    requirement: "Windows 10 / 11 · x64",
    format: "EXE 安装程序",
    pitch: "一键安装，开始菜单直达，厨房里的笔记本也能用。",
    steps: [
      "运行下载好的安装程序，按提示完成安装。",
      "如出现 SmartScreen 提示，点「更多信息」→「仍要运行」（安装包暂未配置发布者签名）。",
      "安装完成后，从开始菜单或桌面快捷方式打开。",
    ],
  },
  {
    id: "android",
    name: "Android",
    Icon: AndroidMark,
    requirement: "Android 7.0 及以上",
    format: "APK",
    pitch: "支持系统语音朗读步骤，双手沾满面粉也不用碰屏幕。",
    steps: [
      "在手机浏览器中下载 APK。",
      "按提示允许浏览器「安装未知应用」。",
      "打开 APK 完成安装。朗读功能使用系统语音引擎，未安装中文语音时会给出提示。",
    ],
  },
  {
    id: "ios",
    name: "iOS / iPadOS",
    Icon: AppleMark,
    requirement: "iOS 16.4 及以上",
    format: "IPA（未签名）",
    pitch: "iPad 立在灶台边，全屏沉浸、屏幕常亮。",
    caution: "需自行签名",
    steps: [
      "安装包未签名，需要用你自己的 Apple 开发者证书和描述文件重新签名后才能装到真机。",
      "开发者可下载 Xcode Archive，在 Xcode 中选择自己的团队导出安装。",
      "不想折腾签名？用 Safari 打开网页版，点「分享 › 添加到主屏幕」，同样全屏使用。",
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
            <span className="text-xs text-muted-foreground">全平台可用</span>
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
              把灵感厨房，
              <br />
              装进<span className="text-primary">你的设备</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              分步引导、语音朗读、屏幕常亮。Mac、Windows、Android、iOS 全平台，同一份体验。
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
                detected === "other" && "暂未提供该系统的客户端，也可以直接使用网页版"
              )}
            </p>

          </motion.div>
        </div>

        <a
          href="#platforms"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          全部平台
          <ArrowDown className="h-3.5 w-3.5" />
        </a>
      </section>

      {/* 平台列表 */}
      <section id="platforms" className="mx-auto max-w-6xl scroll-mt-20 px-6">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">全部平台</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {current ? (
                <>已识别你的设备为 <span className="font-semibold text-primary">{current.name}</span>，已为你高亮推荐</>
              ) : (
                "选择适合你设备的安装包"
              )}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            由 CNB 国内加速下载 · 每个文件提供 SHA-256 校验
          </span>
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
          <div className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow-card)] lg:col-span-3">
            <h2 className="text-lg font-bold text-foreground">安装指引</h2>
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
            <div className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">下载源</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                下载按钮默认走 CNB，国内网络更快更稳；海外用户可使用 GitHub 镜像，文件完全一致。
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={CNB_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted">
                  CNB 全部版本 <ExternalLink className="h-3 w-3" />
                </a>
                <a href={GITHUB_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted">
                  GitHub Releases <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-bold text-foreground">需要联网</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                菜谱与 AI 功能需要联网使用，桌面端与移动端 AI 均支持逐段流式回复。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 更新日志 */}
      {release.notes && (
        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="rounded-[var(--radius)] border border-border bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground">{release.version} 更新内容</h2>
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
        <div className="relative overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-primary to-accent px-8 py-10 text-white shadow-[var(--shadow-float)] sm:flex sm:items-center sm:justify-between">
          <div aria-hidden className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
          <div className="relative">
            <h2 className="text-2xl font-black tracking-tight">不想安装？</h2>
            <p className="mt-1.5 text-sm text-white/85">打开浏览器就能跟着做，iPad 上添加到主屏幕即可全屏使用。</p>
          </div>
          <Link
            href="/"
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg transition-transform hover:-translate-y-0.5 sm:mt-0"
          >
            打开网页版
            <ArrowRight className="h-4 w-4" />
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
      animate={{ opacity: 1, y: highlighted ? -6 : 0, scale: highlighted ? 1.02 : 1 }}
      transition={{ delay: 0.35 + index * 0.06, type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "relative flex flex-col rounded-[var(--radius)] border bg-white p-5 transition-shadow",
        highlighted
          ? "order-first border-primary shadow-[var(--shadow-float)] ring-4 ring-primary/15 sm:order-none"
          : "border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)]"
      )}
    >
      {highlighted && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[var(--radius)] ring-2 ring-primary"
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 1.4, repeat: 2, ease: "easeOut", delay: 0.6 }}
        />
      )}

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
          <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">你的设备</span>
        ) : (
          platform.caution && (
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">{platform.caution}</span>
          )
        )}
      </div>

      <h3 className="mt-4 text-lg font-bold text-foreground">{platform.name}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{platform.requirement}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/75">{platform.pitch}</p>

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
        <p className="mt-5 text-xs text-muted-foreground">该平台暂无安装包</p>
      )}
    </motion.div>
  );
}
