import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runSetup } from "../src/cli/setup.js";
import { runUninstall } from "../src/cli/uninstall.js";
import { readFileSync, mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("runSetup", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `hotmarks-cli-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates .hotmarks config in target directory", () => {
    const result = runSetup(testDir);
    expect(result.success).toBe(true);
    expect(existsSync(join(testDir, ".hotmarks"))).toBe(true);
  });

  it("does not overwrite existing .hotmarks", () => {
    writeFileSync(join(testDir, ".hotmarks"), '{"mode":"both"}');
    const result = runSetup(testDir);
    expect(result.configCreated).toBe(false);
    const content = JSON.parse(readFileSync(join(testDir, ".hotmarks"), "utf-8"));
    expect(content.mode).toBe("both");
  });

  it("returns usage instructions", () => {
    const result = runSetup(testDir);
    expect(result.message).toContain("**text**");
    expect(result.message).toContain("__text__");
  });
});

describe("runUninstall", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `hotmarks-uninst-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("removes .hotmarks config when present", () => {
    writeFileSync(join(testDir, ".hotmarks"), "{}");
    const result = runUninstall(testDir, true);
    expect(result.success).toBe(true);
    expect(existsSync(join(testDir, ".hotmarks"))).toBe(false);
  });

  it("succeeds even when no config exists", () => {
    const result = runUninstall(testDir, true);
    expect(result.success).toBe(true);
  });

  it("skips removal when removeConfig is false", () => {
    writeFileSync(join(testDir, ".hotmarks"), "{}");
    const result = runUninstall(testDir, false);
    expect(existsSync(join(testDir, ".hotmarks"))).toBe(true);
  });
});
