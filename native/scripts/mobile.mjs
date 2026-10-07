import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../../", import.meta.url));
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const platform = process.argv[2];
const release = join(root, "native/release", platform);
mkdirSync(release, { recursive: true });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (platform === "android") {
  const android = join(root, "native/android");
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(homedir(), "Library/Android/sdk");
  const studioJava = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
  const env = { ...process.env, ANDROID_HOME: sdk };
  if (!env.JAVA_HOME && existsSync(studioJava)) env.JAVA_HOME = studioJava;
  writeFileSync(join(android, "local.properties"), `sdk.dir=${sdk.replaceAll("\\", "\\\\")}\n`);
  const signed = Boolean(env.COOK_ANDROID_KEYSTORE);
  run(process.platform === "win32" ? "gradlew.bat" : "./gradlew", [signed ? "assembleRelease" : "assembleDebug", "--console=plain"], { cwd: android, env });
  const kind = signed ? "release" : "debug";
  cpSync(join(android, `app/build/outputs/apk/${kind}/app-${kind}.apk`), join(release, `Vibe-Cook-${version}-android${signed ? "" : "-debug"}.apk`));
} else if (platform === "ios") {
  const archive = join(release, "VibeCook.xcarchive");
  run("xcodebuild", [
    "-workspace", "native/ios/App/App.xcworkspace", "-scheme", "App", "-configuration", "Release",
    "-sdk", "iphoneos", "-destination", "generic/platform=iOS", "-archivePath", archive,
    "-derivedDataPath", "native/release/ios-derived", "CODE_SIGNING_ALLOWED=NO", "archive",
  ]);
  const payload = join(release, "unsigned/Payload");
  mkdirSync(payload, { recursive: true });
  cpSync(join(archive, "Products/Applications/App.app"), join(payload, "App.app"), { recursive: true });
  run("ditto", ["-c", "-k", "--keepParent", payload, join(release, `Vibe-Cook-${version}-ios-unsigned.ipa`)]);
} else {
  throw new Error("Usage: node native/scripts/mobile.mjs android|ios");
}
