import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface HotmarksConfig {
  mode: "reminder" | "transform" | "both";
  markers: {
    directive: string;
    critical: string;
  };
  transformTags: {
    directive: string;
    critical: string;
  };
  skipCodeBlocks: boolean;
}

export const DEFAULT_CONFIG: HotmarksConfig = {
  mode: "reminder",
  markers: {
    directive: "**",
    critical: "__",
  },
  transformTags: {
    directive: "[DIRECTIVE: %s]",
    critical: "[CRITICAL: %s]",
  },
  skipCodeBlocks: true,
};

export function loadConfig(
  projectDir: string,
  homeDir: string = homedir()
): HotmarksConfig {
  const projectPath = join(projectDir, ".hotmarks");
  const homePath = join(homeDir, ".hotmarks");

  const raw = readConfigFile(projectPath) ?? readConfigFile(homePath);
  if (!raw) return { ...DEFAULT_CONFIG };

  return mergeWithDefaults(raw);
}

function readConfigFile(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  try {
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function mergeWithDefaults(raw: Record<string, unknown>): HotmarksConfig {
  return {
    mode: isValidMode(raw.mode) ? raw.mode : DEFAULT_CONFIG.mode,
    markers: {
      ...DEFAULT_CONFIG.markers,
      ...(typeof raw.markers === "object" && raw.markers !== null
        ? (raw.markers as Record<string, string>)
        : {}),
    },
    transformTags: {
      ...DEFAULT_CONFIG.transformTags,
      ...(typeof raw.transformTags === "object" && raw.transformTags !== null
        ? (raw.transformTags as Record<string, string>)
        : {}),
    },
    skipCodeBlocks:
      typeof raw.skipCodeBlocks === "boolean"
        ? raw.skipCodeBlocks
        : DEFAULT_CONFIG.skipCodeBlocks,
  };
}

function isValidMode(v: unknown): v is HotmarksConfig["mode"] {
  return v === "reminder" || v === "transform" || v === "both";
}

export function createDefaultConfig(dir: string): void {
  const configPath = join(dir, ".hotmarks");
  if (existsSync(configPath)) return;
  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
}
