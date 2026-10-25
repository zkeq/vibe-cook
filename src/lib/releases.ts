// 客户端发布信息：以 CNB Release 为主下载源，GitHub Release 为镜像
export const CNB_RELEASES_URL = "https://cnb.cool/onmicrosoft/vibe-cook/frontend/-/releases";
export const GITHUB_RELEASES_URL = "https://github.com/zkeq/vibe-cook/releases";

export type PlatformId = "macos" | "windows" | "android" | "ios";

export interface ReleaseAsset {
  name: string;
  size: number;
  sha256?: string;
  url: string;       // CNB 下载地址
  mirrorUrl: string; // GitHub 镜像
}

export interface ReleaseInfo {
  version: string;   // "v0.1.6"
  publishedAt: string;
  notes: string;
  assets: ReleaseAsset[];
}

interface CnbAsset {
  name: string;
  size: number;
  hash_value?: string;
  browser_download_url: string;
}

function mirrorOf(tag: string, name: string) {
  return `${GITHUB_RELEASES_URL}/download/${tag}/${name}`;
}

// 接口不可用时的兜底：v0.1.6
const FALLBACK_TAG = "v0.1.6";
const FALLBACK_ASSETS: [string, number, string][] = [
  ["Vibe-Cook-0.1.6-macos-universal.dmg", 19154986, "dd0481ef7fadd7438f3f75f092afa6590eeaf76a3882f9c1a2cd9219b8a5bc7c"],
  ["Vibe-Cook-0.1.6-macos-universal.zip", 19772767, "a33c6beb6ee7115532b51d4296d361d9f1f2c2ac6d2c8f0d49f024db6adf4271"],
  ["Vibe-Cook-0.1.6-windows-x64-setup.exe", 9098129, "68327300ae9bd827df6726ac7dea1b947d84416c9d57220e1f70cdaad39dd0f3"],
  ["Vibe-Cook-0.1.6-android-debug.apk", 9431326, "113fa77e8f7efcd3f70c6e485030f37c82dc0b6de3aa006679b21b272d2ee4ef"],
  ["Vibe-Cook-0.1.6-ios-unsigned.ipa", 8038540, "b33c4bfc335c6069b3c9d32c17da96a186cd4d417b15ead54cfe07e829d17d4c"],
  ["Vibe-Cook-0.1.6-ios-xcarchive.zip", 12295742, "5c1cbd10bf16c4b38fbde4f90f79ca1ec76b002e7e513ad9e069552e1bc3e942"],
];

export const FALLBACK_RELEASE: ReleaseInfo = {
  version: FALLBACK_TAG,
  publishedAt: "2026-10-17T07:28:09Z",
  notes: "",
  assets: FALLBACK_ASSETS.map(([name, size, sha256]) => ({
    name,
    size,
    sha256,
    url: `${CNB_RELEASES_URL}/download/${FALLBACK_TAG}/${name}`,
    mirrorUrl: mirrorOf(FALLBACK_TAG, name),
  })),
};

export async function fetchLatestRelease(): Promise<ReleaseInfo> {
  try {
    // 仓库里还有 kws-* 等非客户端的 Release，只取 vX.Y.Z 的正式版
    const res = await fetch(`${CNB_RELEASES_URL}?page=1&page_size=20`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    });
    if (!res.ok) throw new Error(`CNB ${res.status}`);
    const list: { tag_name: string; draft?: boolean; prerelease?: boolean }[] = await res.json();
    const data = list.find((r) => /^v\d+\.\d+\.\d+$/.test(r.tag_name) && !r.draft && !r.prerelease) as
      | ({ tag_name: string; published_at: string; body?: string; assets: CnbAsset[] })
      | undefined;
    if (!data) throw new Error("CNB has no client release");
    const assets: ReleaseAsset[] = data.assets.map((a) => ({
      name: a.name,
      size: a.size,
      sha256: a.hash_value,
      url: a.browser_download_url,
      mirrorUrl: mirrorOf(data.tag_name, a.name),
    }));
    if (!assets.length) throw new Error("CNB release has no assets");
    return { version: data.tag_name, publishedAt: data.published_at, notes: data.body ?? "", assets };
  } catch (error) {
    console.error("Failed to load latest release:", error);
    return FALLBACK_RELEASE;
  }
}

// 每个平台的主安装包与附加包（按文件名后缀匹配）
export const PLATFORM_FILES: Record<PlatformId, { primary: RegExp; extras: { pattern: RegExp; label: string }[] }> = {
  macos: { primary: /macos-universal\.dmg$/, extras: [{ pattern: /macos-universal\.zip$/, label: "ZIP 压缩包" }] },
  windows: { primary: /windows-x64-setup\.exe$/, extras: [] },
  android: { primary: /android-[\w-]*\.apk$/, extras: [] },
  ios: { primary: /ios-unsigned\.ipa$/, extras: [{ pattern: /ios-xcarchive\.zip$/, label: "Xcode Archive" }] },
};

export function detectPlatform(): PlatformId | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // iPadOS 默认伪装成 Mac，靠触点数区分
  if (/macintosh|mac os x/i.test(ua)) return navigator.maxTouchPoints > 1 ? "ios" : "macos";
  if (/windows/i.test(ua)) return "windows";
  return "other";
}

export function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
