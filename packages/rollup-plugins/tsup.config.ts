import { defineConfig } from "tsup"

// "build": "tsup --config tsup.config.ts",
// "dev": "pnpm build --watch"

export default defineConfig
({
    entry: ["source/**/*"],
    splitting: false,
    sourcemap: true,
    clean: true,
    outDir: "dist",
    keepNames: true,
    dts: true,
    format: ["cjs", "esm"],
    bundle: false,
})