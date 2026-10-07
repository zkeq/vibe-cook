import { cpSync, rmSync } from "node:fs";
const source = new URL("../dist/", import.meta.url);
const target = new URL("../desktop/frontend/", import.meta.url);
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
