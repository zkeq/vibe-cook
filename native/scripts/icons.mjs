import { readdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../../", import.meta.url));
const orange = "#f5701f";
// Keep the generated artwork as the single source for every platform.
const source = await sharp(join(root, "native/assets/app-icon.png")).resize(1024, 1024).flatten({ background: orange }).png().toBuffer();
const roundedMask = Buffer.from('<svg width="1024" height="1024"><rect width="1024" height="1024" rx="224" fill="white"/></svg>');
const rounded = await sharp(source).ensureAlpha().composite([{ input: roundedMask, blend: "dest-in" }]).png().toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><image width="1024" height="1024" href="data:image/png;base64,${rounded.toString("base64")}"/></svg>\n`;
writeFileSync(join(root, "public/icon.svg"), svg);
for (const size of [192, 512]) {
  await sharp(source).resize(size, size).png().toFile(join(root, `public/icon-${size}.png`));
}
// Preserve the complete artwork with smooth rounded-square corners, never a circle.
writeFileSync(join(root, "native/desktop/resources/icon.png"), rounded);
// iOS requires opaque artwork and applies rounded corners itself.
writeFileSync(join(root, "native/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"), source);

// PNG-backed ICO supported by modern browsers and Windows.
const favicon = await sharp(rounded).resize(256, 256).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(favicon.length, 14);
header.writeUInt32LE(22, 18);
writeFileSync(join(root, "src/app/favicon.ico"), Buffer.concat([header, favicon]));

const res = join(root, "native/android/app/src/main/res");
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [density, scale] of Object.entries(densities)) {
  const dir = join(res, `mipmap-${density}`);
  const legacySize = Math.round(48 * scale);
  await sharp(rounded).resize(legacySize, legacySize).png().toFile(join(dir, "ic_launcher.png"));
  await sharp(rounded).resize(legacySize, legacySize).png().toFile(join(dir, "ic_launcher_round.png"));
  const size = Math.round(108 * scale);
  // Full bleed artwork avoids an inset orange square inside adaptive masks.
  await sharp(source).resize(size, size).png().toFile(join(dir, "ic_launcher_foreground.png"));
}

const splashDirs = [join(root, "native/ios/App/App/Assets.xcassets/Splash.imageset"), ...readdirSync(res).filter((name) => name.startsWith("drawable") && !name.includes("v24")).map((name) => join(res, name))];
for (const dir of splashDirs) for (const name of readdirSync(dir).filter((name) => name.startsWith("splash") && name.endsWith(".png"))) {
  const file = join(dir, name);
  const { width, height } = await sharp(readFileSync(file)).metadata();
  const size = Math.min(256, Math.round(Math.min(width, height) * 0.15));
  const logo = await sharp(rounded).resize(size, size).png().toBuffer();
  await sharp({ create: { width, height, channels: 4, background: "#ffffff" } }).composite([{ input: logo, gravity: "centre" }]).png().toFile(file + ".tmp");
  renameSync(file + ".tmp", file);
}
