import { useEffect, useRef, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Channel, call, isMyGo } from "mygo-runtime";
import { Download, RefreshCw, X } from "lucide-react";

// 桌面端 Go 服务 Updates（native/desktop/updates.go）；生成的绑定文件不入库，CI 检查时没有，这里直接调用
interface UpdateProgress { downloaded: number; total: number }
const Updates = {
  check: () => call<string>("Updates.Check"),
  install: (progress: Channel<UpdateProgress>) => call<void>("Updates.Install", progress),
  relaunch: () => call<void>("Updates.Relaunch"),
};

interface AndroidUpdate { current: string; version?: string; url?: string; size?: number }
interface AppUpdaterPlugin {
  check(): Promise<AndroidUpdate>;
  download(options: { url: string }): Promise<void>;
  install(): Promise<{ needsPermission: boolean }>;
  addListener(event: "downloadProgress", listener: (progress: UpdateProgress) => void): Promise<{ remove(): Promise<void> }>;
}
const AppUpdater = registerPlugin<AppUpdaterPlugin>("AppUpdater");

type UpdateState =
  | { status: "idle" }
  | { status: "downloading"; version: string; downloaded: number; total: number }
  | { status: "ready"; version: string; needsPermission?: boolean }
  | { status: "error"; version: string; message: string };

const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

type SetState = (state: UpdateState) => void;

async function installAndroid(version: string, setState: SetState) {
  const { needsPermission } = await AppUpdater.install();
  setState({ status: "ready", version, needsPermission });
}

/** 检查并下载安装新版本；onReady 在下载完成时调用（重新显示被隐藏的卡片）。 */
async function runUpdate(setState: SetState, onReady: () => void) {
  if (isMyGo()) {
    const version = await Updates.check();
    if (!version) return;
    setState({ status: "downloading", version, downloaded: 0, total: 0 });
    const progress = new Channel<UpdateProgress>(({ downloaded, total }) =>
      setState({ status: "downloading", version, downloaded, total }));
    try {
      await Updates.install(progress);
      onReady();
      setState({ status: "ready", version });
    } catch (error) {
      setState({ status: "error", version, message: errorMessage(error) });
    }
  } else if (Capacitor.getPlatform() === "android") {
    const update = await AppUpdater.check();
    if (!update.version || !update.url) return;
    const version = update.version;
    setState({ status: "downloading", version, downloaded: 0, total: update.size ?? 0 });
    const listener = await AppUpdater.addListener("downloadProgress", ({ downloaded, total }) =>
      setState({ status: "downloading", version, downloaded, total }));
    try {
      await AppUpdater.download({ url: update.url });
      onReady();
      await installAndroid(version, setState);
    } catch (error) {
      setState({ status: "error", version, message: errorMessage(error) });
    } finally {
      void listener.remove();
    }
  }
}

/** 启动时检查新版本，自动下载并安装：桌面端替换应用后重启，安卓下载 APK 后调起系统安装。 */
export function AppUpdateCard() {
  const [state, setState] = useState<UpdateState>({ status: "idle" });
  const [hidden, setHidden] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // 检查失败（离线等）时静默，不打扰使用
    void runUpdate(setState, () => setHidden(false)).catch(() => {});
  }, []);

  // 从「安装未知应用」设置页回来后自动继续安装
  useEffect(() => {
    if (state.status !== "ready" || !state.needsPermission) return;
    const version = state.version;
    const handle = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void installAndroid(version, setState).catch(() => {});
    });
    return () => { void handle.then((h) => h.remove()); };
  }, [state]);

  if (state.status === "idle" || hidden) return null;

  const percent = state.status === "downloading" && state.total > 0
    ? Math.min(100, Math.round((state.downloaded / state.total) * 100))
    : 0;
  const android = Capacitor.getPlatform() === "android";

  return (
    <div
      className="fixed inset-x-0 z-[100] flex justify-center px-4"
      style={{ bottom: "calc(var(--native-safe-bottom) + 16px)" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-white p-4 shadow-lg shadow-black/5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {state.status === "ready" ? <RefreshCw className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">
              {state.status === "downloading" && `正在下载 v${state.version}`}
              {state.status === "ready" && (android
                ? state.needsPermission ? "请允许安装此应用" : `v${state.version} 已下载`
                : `v${state.version} 已安装`)}
              {state.status === "error" && "更新失败"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {state.status === "downloading" && (state.total > 0
                ? `${formatMB(state.downloaded)} / ${formatMB(state.total)} MB · ${percent}%`
                : "准备下载…")}
              {state.status === "ready" && (android
                ? state.needsPermission ? "在设置中打开「允许安装未知应用」后返回，将自动继续安装" : "在系统弹窗中确认安装"
                : "重启应用后生效")}
              {state.status === "error" && state.message}
            </p>
          </div>
          <button
            onClick={() => setHidden(true)}
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-neutral-100"
            aria-label="隐藏更新提示"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {state.status === "downloading" && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${percent}%` }} />
          </div>
        )}

        {state.status === "ready" && (
          <button
            onClick={() => void (android ? installAndroid(state.version, setState) : Updates.relaunch()).catch(() => {})}
            className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            {android ? "安装" : "立即重启"}
          </button>
        )}

        {state.status === "error" && (
          <button
            onClick={() => { setState({ status: "idle" }); void runUpdate(setState, () => setHidden(false)).catch(() => {}); }}
            className="mt-3 w-full rounded-xl border border-border py-2 text-sm font-bold text-foreground transition-colors hover:bg-neutral-50"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}
