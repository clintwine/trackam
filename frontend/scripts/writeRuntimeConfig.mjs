import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const targetPath = process.argv[2] ?? "dist/runtime-config.js";
const apiBaseUrl = (process.env.VITE_API_URL ?? "").trim();

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(
  targetPath,
  `window.__APP_CONFIG__ = ${JSON.stringify(
    { VITE_API_URL: apiBaseUrl },
    null,
    2
  )};\n`,
  "utf8"
);
