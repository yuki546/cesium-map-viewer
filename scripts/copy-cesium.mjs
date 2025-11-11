import { cpSync, rmSync } from "node:fs";
import { join } from "node:path";

const src = join("node_modules", "cesium", "Build", "Cesium");
const dst = join("public", "cesium");

rmSync(dst, { recursive: true, force: true });
cpSync(src, dst, { recursive: true });

console.log("Copied Cesium assets to public/cesium");
