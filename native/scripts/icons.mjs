import { readdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChefHat } from "lucide-react";
import sharp from "sharp";

const root = fileURLToPath(new URL("../../", import.meta.url));
const orange = "#f5701f";
// Use exactly the ChefHat mark shown by the shared website's Navbar.
const mark = renderToStaticMarkup(createElement(ChefHat, { x: 128, y: 128, width: 256, height: 256, stroke: "white", strokeWidth: 2 }));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${orange}"/>${mark}</svg>\n`;
writeFileSync(join(root, "public/icon.svg"), svg);
const source = Buffer.from(svg);
await sharp(source).resize(1024, 1024).png().toFile(join(root, "native/desktop/resources/icon.png"));
await sharp(source).resize(1024, 1024).flatten({ background: orange }).png().toFile(join(root, "native/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"));

const res = join(root, "native/android/app/src/main/res");
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [density, scale] of Object.entries(densities)) {
  const dir = join(res, `mipmap-${density}`);
  for (const name of ["ic_launcher.png", "ic_launcher_round.png"]) {
    await sharp(source).resize(Math.round(48 * scale), Math.round(48 * scale)).png().toFile(join(dir, name));
  }
  const size = Math.round(108 * scale);
  const foreground = await sharp(source).resize(Math.round(66 * scale), Math.round(66 * scale)).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#00000000" } }).composite([{ input: foreground, gravity: "centre" }]).png().toFile(join(dir, "ic_launcher_foreground.png"));
}

const splashDirs = [join(root, "native/ios/App/App/Assets.xcassets/Splash.imageset"), ...readdirSync(res).filter((name) => name.startsWith("drawable") && !name.includes("v24")).map((name) => join(res, name))];
for (const dir of splashDirs) for (const name of readdirSync(dir).filter((name) => name.startsWith("splash") && name.endsWith(".png"))) {
  const file = join(dir, name);
  const { width, height } = await sharp(readFileSync(file)).metadata();
  const size = Math.min(256, Math.round(Math.min(width, height) * 0.15));
  const logo = await sharp(source).resize(size, size).png().toBuffer();
  await sharp({ create: { width, height, channels: 4, background: "#ffffff" } }).composite([{ input: logo, gravity: "centre" }]).png().toFile(file + ".tmp");
  renameSync(file + ".tmp", file);
}
