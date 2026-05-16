import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, createDefaultConfig, DEFAULT_CONFIG, type HotmarksConfig } from "../src/config.js";
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("DEFAULT_CONFIG", () => {
  it("has correct defaults", () => {
    expect(DEFAULT_CONFIG.mode).toBe("reminder");
    expect(DEFAULT_CONFIG.skipCodeBlocks).toBe(true);
    expect(DEFAULT_CONFIG.markers.directive).toBe("**");
    expect(DEFAULT_CONFIG.markers.critical).toBe("__");
  });
});

describe("loadConfig", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `hotmarks-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns defaults when no config file exists", () => {
    const config = loadConfig(testDir, "/nonexistent");
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("loads config from project directory", () => {
    const configPath = join(testDir, ".hotmarks");
    writeFileSync(configPath, JSON.stringify({ mode: "transform" }));
    const config = loadConfig(testDir, "/nonexistent");
    expect(config.mode).toBe("transform");
    expect(config.skipCodeBlocks).toBe(true);
  });

  it("project config overrides home config", () => {
    const homeDir = join(tmpdir(), `hotmarks-home-${Date.now()}`);
    mkdirSync(homeDir, { recursive: true });
    writeFileSync(join(homeDir, ".hotmarks"), JSON.stringify({ mode: "transform" }));
    writeFileSync(join(testDir, ".hotmarks"), JSON.stringify({ mode: "both" }));
    const config = loadConfig(testDir, homeDir);
    expect(config.mode).toBe("both");
    rmSync(homeDir, { recursive: true, force: true });
  });

  it("falls back to home config when no project config", () => {
    const homeDir = join(tmpdir(), `hotmarks-home-${Date.now()}`);
    mkdirSync(homeDir, { recursive: true });
    writeFileSync(join(homeDir, ".hotmarks"), JSON.stringify({ mode: "transform" }));
    const config = loadConfig(testDir, homeDir);
    expect(config.mode).toBe("transform");
    rmSync(homeDir, { recursive: true, force: true });
  });

  it("handles malformed JSON gracefully", () => {
    writeFileSync(join(testDir, ".hotmarks"), "not json{{{");
    const config = loadConfig(testDir, "/nonexistent");
    expect(config).toEqual(DEFAULT_CONFIG);
  });
});

describe("createDefaultConfig", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `hotmarks-create-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates .hotmarks file with defaults", () => {
    createDefaultConfig(testDir);
    expect(existsSync(join(testDir, ".hotmarks"))).toBe(true);
  });

  it("does not overwrite existing config", () => {
    writeFileSync(join(testDir, ".hotmarks"), JSON.stringify({ mode: "both" }));
    createDefaultConfig(testDir);
    const content = JSON.parse(readFileSync(join(testDir, ".hotmarks"), "utf-8"));
    expect(content.mode).toBe("both");
  });
});
