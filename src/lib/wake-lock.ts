/**
 * 屏幕常亮(Wake Lock API)
 * 进入烹饪模式时调用，手上沾水也不用碰屏防止息屏。
 * iPad Safari 16.4+ 支持；不支持时静默降级。
 */

let lock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
    return false;
  }
  try {
    lock = await navigator.wakeLock.request("screen");
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await lock?.release();
  } catch {
    // 忽略
  } finally {
    lock = null;
  }
}

/** 切回前台时自动重新申请(系统会在切后台时释放) */
export function reacquireOnVisible(): () => void {
  if (typeof document === "undefined") return () => {};
  const handler = () => {
    if (document.visibilityState === "visible" && lock === null) {
      void requestWakeLock();
    }
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
