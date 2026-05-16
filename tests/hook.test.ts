import { describe, it, expect } from "vitest";
import { processPrompt } from "../src/hook.js";
import { DEFAULT_CONFIG, type HotmarksConfig } from "../src/config.js";

describe("processPrompt", () => {
  it("returns null when no markers found", () => {
    const result = processPrompt("plain text no markers", DEFAULT_CONFIG);
    expect(result).toBeNull();
  });

  it("returns system reminder in reminder mode", () => {
    const result = processPrompt(
      "please **use TypeScript** for this",
      DEFAULT_CONFIG
    );
    expect(result).toContain("SEMANTIC FORMATTING ACTIVE");
    expect(result).toContain("NON-NEGOTIABLE DIRECTIVE");
    expect(result).toContain("use TypeScript");
  });

  it("returns transformed tags in transform mode", () => {
    const config: HotmarksConfig = { ...DEFAULT_CONFIG, mode: "transform" };
    const result = processPrompt("please **use TypeScript**", config);
    expect(result).toContain("[DIRECTIVE: use TypeScript]");
  });

  it("returns both reminder and tags in both mode", () => {
    const config: HotmarksConfig = { ...DEFAULT_CONFIG, mode: "both" };
    const result = processPrompt("please **use TypeScript**", config);
    expect(result).toContain("SEMANTIC FORMATTING ACTIVE");
    expect(result).toContain("[DIRECTIVE: use TypeScript]");
  });

  it("includes critical markers in output", () => {
    const result = processPrompt(
      "__never delete production data__",
      DEFAULT_CONFIG
    );
    expect(result).toContain("CRITICAL EMPHASIS");
    expect(result).toContain("never delete production data");
  });

  it("lists all directives and criticals found", () => {
    const result = processPrompt(
      "**rule one** and **rule two** plus __critical thing__",
      DEFAULT_CONFIG
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
    const result = processPrompt("**do this** and __important__", config);
    expect(result).toContain("!!! do this !!!");
    expect(result).toContain(">>> important <<<");
  });
});
