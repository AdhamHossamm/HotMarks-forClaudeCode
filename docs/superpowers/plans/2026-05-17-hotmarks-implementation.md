# Hotmarks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `hotmarks`, a Claude Code plugin that gives semantic meaning to **bold** (directive) and __underline__ (critical emphasis) markers in prompts via a prompt-submit hook.

**Architecture:** npm package structured as a Claude Code plugin. A `UserPromptSubmit` hook script receives the prompt via stdin, parses for `**` and `__` markers (skipping code blocks), loads config from `.hotmarks`, and outputs semantic context as `additionalContext` stdout. A CLI setup command creates the `.hotmarks` config file.

**Tech Stack:** TypeScript, Node.js (ESM), Vitest for testing, tsup for bundling.

**Known Constraint:** Claude Code keybindings only map to predefined actions — no `insertSnippet` exists. Users type `**text**` and `__text__` manually. The keybinding feature is deferred until Claude Code supports custom text-insertion actions. The core value (semantic hook) works regardless.

---

## File Structure

```
hotmarks/
├── package.json              # Plugin manifest, bin entry, scripts
├── tsconfig.json             # TypeScript config (ESM, strict)
├── tsup.config.ts            # Build config
├── vitest.config.ts          # Test config
├── src/
│   ├── parser.ts             # Marker extraction logic (pure function)
│   ├── config.ts             # .hotmarks loader + defaults + auto-creator
��   ├── hook.ts               # Hook entry point (reads stdin, writes stdout)
│   ├── cli/
│   │   ├── setup.ts          # `npx hotmarks setup` command
│   │   └── uninstall.ts      # `npx hotmarks uninstall` command
│   └── cli/index.ts          # CLI router (setup | uninstall)
├── skills/
│   └── semantic-formatting/
│       └── SKILL.md          # Skill definition
├── hooks/
│   └── prompt-submit.sh      # Shell wrapper invoking compiled hook
├── tests/
│   ├── parser.test.ts        # Parser unit tests
│   ├── config.test.ts        # Config loader tests
│   ├── hook.test.ts          # Hook integration tests
│   └── cli.test.ts           # CLI command tests
├── .hotmarks.default         # Default config template
└── README.md
```

**Responsibilities:**
- `parser.ts` — Pure function: text in → structured markers out. No I/O.
- `config.ts` — Finds/reads/merges `.hotmarks` config. Creates default on setup.
- `hook.ts` — Orchestrates: read stdin → parse → load config → format output → write stdout.
- `cli/setup.ts` — Creates `.hotmarks` in CWD, prints usage instructions.
- `cli/uninstall.ts` — Removes `.hotmarks` from CWD (with confirmation).
- `skills/semantic-formatting/SKILL.md` — Claude-readable skill doc.
- `hooks/prompt-submit.sh` — Shell entry point Claude Code invokes.

---

### Task 1: Package Scaffold

**Files:**
- Create: `hotmarks/package.json`
- Create: `hotmarks/tsconfig.json`
- Create: `hotmarks/tsup.config.ts`
- Create: `hotmarks/vitest.config.ts`
- Create: `hotmarks/.gitignore`

- [ ] **Step 1: Create project directory and initialize**

```bash
mkdir hotmarks && cd hotmarks
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "hotmarks",
  "version": "0.1.0",
  "type": "module",
  "description": "Semantic formatting plugin for Claude Code. **Bold** = directive. __Underline__ = critical emphasis.",
  "main": "dist/hook.js",
  "bin": {
    "hotmarks": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "npm run build"
  },
  "claude-code-plugin": {
    "id": "hotmarks",
    "name": "Hotmarks",
    "description": "Semantic formatting for prompts. **Bold** = non-negotiable directive. __Underline__ = critical emphasis.",
    "version": "0.1.0"
  },
  "keywords": ["claude-code", "plugin", "semantic", "formatting", "directive"],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsup": "^8.0.0",
    "vitest": "^2.0.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create tsup.config.ts**

```typescript
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
```

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
dist/
*.tsbuildinfo
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, lock file generated.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: scaffold hotmarks package"
```

---

### Task 2: Marker Parser

**Files:**
- Create: `hotmarks/src/parser.ts`
- Create: `hotmarks/tests/parser.test.ts`

- [ ] **Step 1: Write failing tests for parser**

```typescript
// tests/parser.test.ts
import { describe, it, expect } from "vitest";
import { parseMarkers, type ParseResult } from "../src/parser.js";

describe("parseMarkers", () => {
  it("returns empty when no markers present", () => {
    const result = parseMarkers("plain text with no markers");
    expect(result.hasMarkers).toBe(false);
    expect(result.directives).toEqual([]);
    expect(result.criticals).toEqual([]);
  });

  it("extracts bold directive markers", () => {
    const result = parseMarkers("please **always use semicolons** in code");
    expect(result.hasMarkers).toBe(true);
    expect(result.directives).toEqual(["always use semicolons"]);
  });

  it("extracts underline critical markers", () => {
    const result = parseMarkers("the __database must not be dropped__ ever");
    expect(result.hasMarkers).toBe(true);
    expect(result.criticals).toEqual(["database must not be dropped"]);
  });

  it("extracts multiple markers of same type", () => {
    const result = parseMarkers("**rule one** and **rule two** apply");
    expect(result.directives).toEqual(["rule one", "rule two"]);
  });

  it("extracts both types in same prompt", () => {
    const result = parseMarkers("**use TypeScript** and __never skip tests__");
    expect(result.directives).toEqual(["use TypeScript"]);
    expect(result.criticals).toEqual(["never skip tests"]);
  });

  it("ignores markers inside fenced code blocks", () => {
    const input = `some text
\`\`\`
**this is code not a directive**
__this is code not critical__
\`\`\`
**this IS a directive**`;
    const result = parseMarkers(input);
    expect(result.directives).toEqual(["this IS a directive"]);
    expect(result.criticals).toEqual([]);
  });

  it("ignores markers inside inline code", () => {
    const result = parseMarkers("use `**bold**` syntax for directives");
    expect(result.hasMarkers).toBe(false);
  });

  it("ignores empty markers", () => {
    const result = parseMarkers("**** and ____ are empty");
    expect(result.hasMarkers).toBe(false);
  });

  it("ignores unmatched markers", () => {
    const result = parseMarkers("**unmatched bold and __unmatched underline");
    expect(result.hasMarkers).toBe(false);
  });

  it("handles nested markers - outer wins", () => {
    const result = parseMarkers("**__nested text__**");
    expect(result.directives).toEqual(["__nested text__"]);
    expect(result.criticals).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/parser.test.ts`
Expected: FAIL — module `../src/parser.js` not found.

- [ ] **Step 3: Implement the parser**

```typescript
// src/parser.ts
export interface ParseResult {
  hasMarkers: boolean;
  directives: string[];
  criticals: string[];
}

export function parseMarkers(text: string): ParseResult {
  const stripped = stripCodeBlocks(text);
  const directives = extractMatches(stripped, /\*\*(.+?)\*\*/g);
  const criticals = extractMatches(stripped, /__(.+?)__/g);

  return {
    hasMarkers: directives.length > 0 || criticals.length > 0,
    directives,
    criticals,
  };
}

function stripCodeBlocks(text: string): string {
  let result = text.replace(/```[\s\S]*?```/g, (match) =>
    " ".repeat(match.length)
  );
  result = result.replace(/`[^`]+`/g, (match) => " ".repeat(match.length));
  return result;
}

function extractMatches(text: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const content = match[1].trim();
    if (content.length > 0) {
      matches.push(content);
    }
  }
  return matches;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/parser.test.ts`
Expected: All 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/parser.ts tests/parser.test.ts
git commit -m "feat: implement marker parser with code block skipping"
```

---

### Task 3: Config Loader

**Files:**
- Create: `hotmarks/src/config.ts`
- Create: `hotmarks/tests/config.test.ts`
- Create: `hotmarks/.hotmarks.default`

- [ ] **Step 1: Create default config template**

```json
{
  "mode": "reminder",
  "markers": {
    "directive": "**",
    "critical": "__"
  },
  "transformTags": {
    "directive": "[DIRECTIVE: %s]",
    "critical": "[CRITICAL: %s]"
  },
  "skipCodeBlocks": true
}
```

- [ ] **Step 2: Write failing tests for config loader**

```typescript
// tests/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, createDefaultConfig, DEFAULT_CONFIG, type HotmarksConfig } from "../src/config.js";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
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
    expect(config.skipCodeBlocks).toBe(true); // merged with defaults
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
    const content = JSON.parse(
      require("node:fs").readFileSync(join(testDir, ".hotmarks"), "utf-8")
    );
    expect(content.mode).toBe("both");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/config.test.ts`
Expected: FAIL — module `../src/config.js` not found.

- [ ] **Step 4: Implement config loader**

```typescript
// src/config.ts
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/config.test.ts`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/config.ts tests/config.test.ts .hotmarks.default
git commit -m "feat: implement config loader with resolution order and defaults"
```

---

### Task 4: Hook Entry Point

**Files:**
- Create: `hotmarks/src/hook.ts`
- Create: `hotmarks/tests/hook.test.ts`
- Create: `hotmarks/hooks/prompt-submit.sh`

- [ ] **Step 1: Write failing tests for hook**

```typescript
// tests/hook.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/hook.test.ts`
Expected: FAIL — module `../src/hook.js` not found.

- [ ] **Step 3: Implement hook logic**

```typescript
// src/hook.ts
import { parseMarkers } from "./parser.js";
import { loadConfig, type HotmarksConfig } from "./config.js";

export function processPrompt(
  prompt: string,
  config: HotmarksConfig
): string | null {
  const parsed = parseMarkers(prompt);
  if (!parsed.hasMarkers) return null;

  const parts: string[] = [];

  if (config.mode === "reminder" || config.mode === "both") {
    parts.push(buildReminder(parsed.directives, parsed.criticals));
  }

  if (config.mode === "transform" || config.mode === "both") {
    parts.push(buildTransformed(parsed.directives, parsed.criticals, config));
  }

  return parts.join("\n\n");
}

function buildReminder(directives: string[], criticals: string[]): string {
  const lines: string[] = [
    "SEMANTIC FORMATTING ACTIVE in this prompt:",
  ];

  if (directives.length > 0) {
    lines.push("");
    lines.push("NON-NEGOTIABLE DIRECTIVE(S) — must be followed exactly:");
    for (const d of directives) {
      lines.push(`  - ${d}`);
    }
  }

  if (criticals.length > 0) {
    lines.push("");
    lines.push("CRITICAL EMPHASIS — highest importance, prioritize above all else:");
    for (const c of criticals) {
      lines.push(`  - ${c}`);
    }
  }

  return lines.join("\n");
}

function buildTransformed(
  directives: string[],
  criticals: string[],
  config: HotmarksConfig
): string {
  const lines: string[] = ["Semantic markers extracted:"];

  for (const d of directives) {
    lines.push(config.transformTags.directive.replace("%s", d));
  }
  for (const c of criticals) {
    lines.push(config.transformTags.critical.replace("%s", c));
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let hookInput: { prompt?: string; cwd?: string };
  try {
    hookInput = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const prompt = hookInput.prompt;
  if (!prompt) {
    process.exit(0);
  }

  const cwd = hookInput.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const output = processPrompt(prompt, config);

  if (output) {
    process.stdout.write(output);
  }
}

const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("hook.js");

if (isMainModule) {
  main();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/hook.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Create shell wrapper for hook**

```bash
#!/bin/sh
# hooks/prompt-submit.sh
node "$(dirname "$0")/../dist/hook.js"
```

Make executable: `chmod +x hooks/prompt-submit.sh`

For Windows, also create `hooks/prompt-submit.cmd`:
```cmd
@echo off
node "%~dp0..\dist\hook.js"
```

- [ ] **Step 6: Commit**

```bash
git add src/hook.ts tests/hook.test.ts hooks/
git commit -m "feat: implement prompt-submit hook with reminder and transform modes"
```

---

### Task 5: Skill Definition

**Files:**
- Create: `hotmarks/skills/semantic-formatting/SKILL.md`

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p skills/semantic-formatting
```

- [ ] **Step 2: Write SKILL.md**

```markdown
---
name: semantic-formatting
description: Detect and respect semantic formatting markers in prompts. **bold** = non-negotiable directive. __underline__ = critical emphasis. Active when hotmarks plugin is installed.
user-invocable: false
---

# Semantic Formatting

When this plugin is active, the user's prompts may contain semantic markers:

## Markers

| Syntax | Meaning | Your behavior |
|--------|---------|---------------|
| `**text**` | Non-negotiable directive | You MUST follow this exactly. No deviation. |
| `__text__` | Critical emphasis | Treat as highest priority. Prioritize above other instructions. |

## Rules

1. If a prompt contains `**bold text**`, treat the bold content as a hard constraint that cannot be violated.
2. If a prompt contains `__underlined text__`, treat it as the most important part of the instruction — prioritize it above everything else.
3. Unmarked text has normal priority.
4. If a directive contradicts a critical emphasis, the directive wins (it's non-negotiable).

## Examples

User writes: "Refactor this function **do not change the public API** and __make sure tests still pass__"

Your behavior:
- "do not change the public API" → absolute constraint, cannot violate
- "make sure tests still pass" → highest priority concern, verify this
- "Refactor this function" → normal instruction, execute within constraints
```

- [ ] **Step 3: Commit**

```bash
git add skills/
git commit -m "feat: add semantic-formatting skill definition"
```

---

### Task 6: CLI Setup Command

**Files:**
- Create: `hotmarks/src/cli/index.ts`
- Create: `hotmarks/src/cli/setup.ts`
- Create: `hotmarks/src/cli/uninstall.ts`
- Create: `hotmarks/tests/cli.test.ts`

- [ ] **Step 1: Write failing tests for CLI**

```typescript
// tests/cli.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/cli.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement setup command**

```typescript
// src/cli/setup.ts
import { createDefaultConfig } from "../config.js";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface SetupResult {
  success: boolean;
  configCreated: boolean;
  message: string;
}

export function runSetup(targetDir: string): SetupResult {
  const configExists = existsSync(join(targetDir, ".hotmarks"));
  createDefaultConfig(targetDir);

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
```

- [ ] **Step 4: Implement uninstall command**

```typescript
// src/cli/uninstall.ts
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
```

- [ ] **Step 5: Implement CLI router**

```typescript
// src/cli/index.ts
#!/usr/bin/env node
import { runSetup } from "./setup.js";
import { runUninstall } from "./uninstall.js";

const command = process.argv[2];

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
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/cli.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/cli/ tests/cli.test.ts
git commit -m "feat: implement CLI setup and uninstall commands"
```

---

### Task 7: Integration & README

**Files:**
- Create: `hotmarks/README.md`
- Verify: full build + all tests pass

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (parser + config + hook + cli).

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: `dist/` contains `hook.js` and `cli/index.js`.

- [ ] **Step 3: Write README.md**

```markdown
# Hotmarks

Semantic formatting plugin for Claude Code. Give your prompts **weight**.

- `**bold text**` = Non-negotiable directive (Claude MUST follow)
- `__underlined text__` = Critical emphasis (highest priority)

## Install

```bash
claude plugin add hotmarks
npx hotmarks setup
```

## Usage

Type markers directly in your Claude Code prompts:

```
Refactor this function **do not change the public API** and focus on __performance is critical__
```

The plugin detects markers on submission and tells Claude to treat them with appropriate authority.

## Configuration

Edit `.hotmarks` in your project root (created by `npx hotmarks setup`):

```json
{
  "mode": "reminder",
  "markers": {
    "directive": "**",
    "critical": "__"
  },
  "transformTags": {
    "directive": "[DIRECTIVE: %s]",
    "critical": "[CRITICAL: %s]"
  },
  "skipCodeBlocks": true
}
```

### Modes

| Mode | Behavior |
|------|----------|
| `reminder` | Adds context explaining what markers mean (default) |
| `transform` | Replaces markers with explicit semantic tags |
| `both` | Does both |

## Uninstall

```bash
npx hotmarks uninstall
claude plugin remove hotmarks
```

## How It Works

1. You type `**text**` or `__text__` in your prompt
2. On submission, the hook parses markers (skipping code blocks)
3. Based on your config mode, it outputs semantic context
4. Claude receives the context and treats marked text with authority
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with install and usage instructions"
```

- [ ] **Step 5: Final verification**

Run: `npm run build && npx vitest run`
Expected: Build succeeds, all tests pass. Package is ready for publishing.

- [ ] **Step 6: Final commit (if any changes needed)**

```bash
git add -A
git commit -m "chore: final integration verification"
```

---

## Summary

| Task | Component | Tests |
|------|-----------|-------|
| 1 | Package scaffold | — |
| 2 | Marker parser | 11 tests |
| 3 | Config loader | 8 tests |
| 4 | Hook entry point | 7 tests |
| 5 | Skill definition | — |
| 6 | CLI setup/uninstall | 6 tests |
| 7 | Integration + README | Build verification |

**Total: 7 tasks, 32 tests, ~7 files of source code.**
