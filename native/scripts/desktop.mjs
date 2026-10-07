import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const bundled = join(homedir(), ".cache/vibe-cook-tools/go/bin/go");
const go = process.env.VIBE_COOK_GO || (existsSync(bundled) ? bundled : "go");
const args = process.argv.slice(2);
const result = spawnSync(go, ["tool", "mygo", ...args], {
  cwd: fileURLToPath(new URL("../desktop/", import.meta.url)),
  stdio: "inherit",
  env: { ...process.env, PATH: `${dirname(go)}:${process.env.PATH || ""}` },
});
if (result.error) console.error("Go 1.27.1+ is required. Set VIBE_COOK_GO to its executable.", result.error.message);
process.exit(result.status ?? 1);
