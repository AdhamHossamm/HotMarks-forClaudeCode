#!/usr/bin/env node
import {
  createDefaultConfig
} from "../chunk-CJF5WE2U.js";

// src/cli/setup.ts
import { existsSync } from "fs";
import { join } from "path";
function runSetup(targetDir) {
  const configPath = join(targetDir, ".hotmarks");
  const configExists = existsSync(configPath);
  if (!configExists) createDefaultConfig(targetDir);
  const message = `
Hotmarks setup complete!

Usage:
  Type **text** in your prompt to mark a NON-NEGOTIABLE DIRECTIVE.
  Type __text__ in your prompt to mark CRITICAL EMPHASIS.

Examples:
  "Refactor this **do not change the public API**"
  "Fix the bug __this is blocking production__"

Config: ${join(targetDir, ".hotmarks")}
Edit .hotmarks to change mode (reminder/transform/both).
`.trim();
  return {
    success: true,
    configCreated: !configExists,
    message
  };
}

// src/cli/uninstall.ts
import { existsSync as existsSync2, unlinkSync } from "fs";
import { join as join2 } from "path";
function runUninstall(targetDir, removeConfig) {
  if (removeConfig) {
    const configPath = join2(targetDir, ".hotmarks");
    if (existsSync2(configPath)) {
      unlinkSync(configPath);
    }
  }
  return {
    success: true,
    message: "Hotmarks uninstalled. Remove the plugin with: claude plugin remove hotmarks"
  };
}

// src/cli/index.ts
var command = process.argv[2];
switch (command) {
  case "setup": {
    const result = runSetup(process.cwd());
    console.log(result.message);
    break;
  }
  case "uninstall": {
    const result = runUninstall(process.cwd(), true);
    console.log(result.message);
    break;
  }
  default:
    console.log("Usage: hotmarks <setup|uninstall>");
    console.log("  setup     - Create .hotmarks config in current directory");
    console.log("  uninstall - Remove .hotmarks config");
    process.exit(1);
}
