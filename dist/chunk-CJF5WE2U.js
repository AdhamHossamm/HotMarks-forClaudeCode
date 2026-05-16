// src/config.ts
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
var DEFAULT_CONFIG = {
  mode: "reminder",
  markers: {
    directive: "**",
    critical: "__"
  },
  transformTags: {
    directive: "[DIRECTIVE: %s]",
    critical: "[CRITICAL: %s]"
  },
  skipCodeBlocks: true
};
function loadConfig(projectDir, homeDir = homedir()) {
  const projectPath = join(projectDir, ".hotmarks");
  const homePath = join(homeDir, ".hotmarks");
  const raw = readConfigFile(projectPath) ?? readConfigFile(homePath);
  if (!raw) return { ...DEFAULT_CONFIG };
  return mergeWithDefaults(raw);
}
function readConfigFile(path) {
  try {
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function mergeWithDefaults(raw) {
  return {
    mode: isValidMode(raw.mode) ? raw.mode : DEFAULT_CONFIG.mode,
    markers: {
      ...DEFAULT_CONFIG.markers,
      ...typeof raw.markers === "object" && raw.markers !== null ? raw.markers : {}
    },
    transformTags: {
      ...DEFAULT_CONFIG.transformTags,
      ...typeof raw.transformTags === "object" && raw.transformTags !== null ? raw.transformTags : {}
    },
    skipCodeBlocks: typeof raw.skipCodeBlocks === "boolean" ? raw.skipCodeBlocks : DEFAULT_CONFIG.skipCodeBlocks
  };
}
function isValidMode(v) {
  return v === "reminder" || v === "transform" || v === "both";
}
function createDefaultConfig(dir) {
  const configPath = join(dir, ".hotmarks");
  if (existsSync(configPath)) return;
  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
}

export {
  loadConfig,
  createDefaultConfig
};
