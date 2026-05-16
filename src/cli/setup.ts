import { createDefaultConfig } from "../config.js";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface SetupResult {
  success: boolean;
  configCreated: boolean;
  message: string;
}

export function runSetup(targetDir: string): SetupResult {
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
    message,
  };
}
