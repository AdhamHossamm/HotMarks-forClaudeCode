import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/hook.ts", "src/cli/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: true,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
