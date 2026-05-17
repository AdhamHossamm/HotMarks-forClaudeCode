import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { processPrompt } from "../src/hook.js";
import { DEFAULT_CONFIG, type HotmarksConfig } from "../src/config.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("processPrompt", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "hotmarks-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns null when no markers found", () => {
    const result = processPrompt("plain text no markers", DEFAULT_CONFIG, tempDir);
    expect(result).toBeNull();
  });

  it("returns system reminder in reminder mode", () => {
    const result = processPrompt(
      "please **use TypeScript** for this",
      DEFAULT_CONFIG,
      tempDir
    );
    expect(result).toContain("SEMANTIC FORMATTING ACTIVE");
    expect(result).toContain("ACTIVE DIRECTIVES (1/4)");
    expect(result).toContain("use TypeScript");
  });

  it("returns transformed tags in transform mode", () => {
    const config: HotmarksConfig = { ...DEFAULT_CONFIG, mode: "transform" };
    const result = processPrompt("please **use TypeScript**", config, tempDir);
    expect(result).toContain("[DIRECTIVE: use TypeScript]");
  });

  it("returns both reminder and tags in both mode", () => {
    const config: HotmarksConfig = { ...DEFAULT_CONFIG, mode: "both" };
    const result = processPrompt("please **use TypeScript**", config, tempDir);
    expect(result).toContain("SEMANTIC FORMATTING ACTIVE");
    expect(result).toContain("[DIRECTIVE: use TypeScript]");
  });

  it("includes emphasis markers in output", () => {
    const result = processPrompt(
      "__never delete production data__",
      DEFAULT_CONFIG,
      tempDir
    );
    expect(result).toContain("EMPHASIS THIS MESSAGE");
    expect(result).toContain("never delete production data");
  });

  it("lists all directives and criticals found", () => {
    const result = processPrompt(
      "**rule one** and **rule two** plus __critical thing__",
      DEFAULT_CONFIG,
      tempDir
    );
    expect(result).toContain("rule one");
    expect(result).toContain("rule two");
    expect(result).toContain("critical thing");
  });

  it("uses custom transform tags from config", () => {
    const config: HotmarksConfig = {
      ...DEFAULT_CONFIG,
      mode: "transform",
      transformTags: {
        directive: "!!! %s !!!",
        critical: ">>> %s <<<",
      },
    };
    const result = processPrompt("**do this** and __important__", config, tempDir);
    expect(result).toContain("!!! do this !!!");
    expect(result).toContain(">>> important <<<");
  });

  it("persists directives across calls", () => {
    processPrompt("**always use strict mode**", DEFAULT_CONFIG, tempDir);
    const result = processPrompt("now do something else __quickly__", DEFAULT_CONFIG, tempDir);
    expect(result).toContain("always use strict mode");
    expect(result).toContain("ACTIVE DIRECTIVES (1/4)");
    expect(result).toContain("quickly");
  });

  it("enforces max 4 directives", () => {
    processPrompt("**one**", DEFAULT_CONFIG, tempDir);
    processPrompt("**two**", DEFAULT_CONFIG, tempDir);
    processPrompt("**three**", DEFAULT_CONFIG, tempDir);
    processPrompt("**four**", DEFAULT_CONFIG, tempDir);
    const result = processPrompt("**five**", DEFAULT_CONFIG, tempDir);
    expect(result).toContain("REJECTED");
    expect(result).toContain("five");
    expect(result).toContain("ACTIVE DIRECTIVES (4/4)");
  });

  it("clears all directives with !clear", () => {
    processPrompt("**one**", DEFAULT_CONFIG, tempDir);
    processPrompt("**two**", DEFAULT_CONFIG, tempDir);
    const result = processPrompt("**!clear**", DEFAULT_CONFIG, tempDir);
    expect(result).toContain("ALL DIRECTIVES CLEARED");
  });

  it("removes specific directive with !remove:", () => {
    processPrompt("**use TypeScript**", DEFAULT_CONFIG, tempDir);
    processPrompt("**no console.log**", DEFAULT_CONFIG, tempDir);
    const result = processPrompt("**!remove: use TypeScript**", DEFAULT_CONFIG, tempDir);
    expect(result).toContain("REMOVED");
    expect(result).toContain("use TypeScript");
    expect(result).toContain("ACTIVE DIRECTIVES (1/4)");
    expect(result).toContain("no console.log");
  });

  it("returns null when no markers and no session", () => {
    const result = processPrompt("just a plain message", DEFAULT_CONFIG, tempDir);
    expect(result).toBeNull();
  });
});
