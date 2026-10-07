import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cn.corerevive.cook",
  appName: "灵感厨房",
  webDir: "native/dist",
  android: { path: "native/android", backgroundColor: "#ffffff" },
  ios: { path: "native/ios", backgroundColor: "#ffffff", contentInset: "never" },
};

export default config;
