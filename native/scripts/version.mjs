import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../../", import.meta.url);
const version = JSON.parse(readFileSync(new URL("package.json", root), "utf8")).version;
const parts = version.match(/^(\d+)\.(\d+)\.(\d+)$/)?.slice(1).map(Number);
if (!parts || parts.some((part) => part > 999)) throw new Error("Native releases require a numeric major.minor.patch version (each part <= 999).");
const code = parts[0] * 1_000_000 + parts[1] * 1_000 + parts[2];
if (code < 1 || code > 2_100_000_000) throw new Error("Version is outside Android's versionCode range.");
if (process.env.GITHUB_REF?.startsWith("refs/tags/") && process.env.GITHUB_REF !== `refs/tags/v${version}`) {
  throw new Error(`Release tag must match package.json: v${version}`);
}

function update(path, transform) {
  const file = fileURLToPath(new URL(path, root));
  const before = readFileSync(file, "utf8");
  const after = transform(before);
  if (after !== before) writeFileSync(file, after);
}
update("native/desktop/mygo.json", (text) => {
  const config = JSON.parse(text);
  config.version = version;
  return JSON.stringify(config, null, 2) + "\n";
});
update("native/android/app/build.gradle", (text) => text.replace(/versionName "[^"]+"/, `versionName "${version}"`).replace(/versionCode \d+/, `versionCode ${code}`));
update("native/ios/App/App.xcodeproj/project.pbxproj", (text) => text.replaceAll(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`).replaceAll(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${code};`));
