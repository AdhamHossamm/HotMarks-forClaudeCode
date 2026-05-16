import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

export interface UninstallResult {
  success: boolean;
  message: string;
}

export function runUninstall(
  targetDir: string,
  removeConfig: boolean
): UninstallResult {
  if (removeConfig) {
    const configPath = join(targetDir, ".hotmarks");
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  }

  return {
    success: true,
    message: "Hotmarks uninstalled. Remove the plugin with: claude plugin remove hotmarks",
  };
}
