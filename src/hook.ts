import { parseMarkers } from "./parser.js";
import { loadConfig, type HotmarksConfig } from "./config.js";
import { updateSession, loadSession, type SessionUpdateResult } from "./session.js";

export interface ProcessResult {
  output: string | null;
  sessionUpdate: SessionUpdateResult | null;
}

export function processPrompt(
  prompt: string,
  config: HotmarksConfig,
  cwd?: string
): string | null {
  const parsed = parseMarkers(prompt);
  const workingDir = cwd ?? process.cwd();

  // Update session with any new directives from this prompt
  let sessionResult: SessionUpdateResult | null = null;
  if (parsed.directives.length > 0) {
    sessionResult = updateSession(workingDir, parsed.directives);
  }

  // Load current session (may have been updated above, or may have pre-existing directives)
  const session = sessionResult?.session ?? loadSession(workingDir);
  const hasActiveDirectives = session.directives.length > 0;
  const hasCriticals = parsed.criticals.length > 0;

  if (!hasActiveDirectives && !hasCriticals && !sessionResult?.cleared && !sessionResult?.removed.length) {
    return null;
  }

  const parts: string[] = [];

  if (config.mode === "reminder" || config.mode === "both") {
    parts.push(buildReminder(session.directives, parsed.criticals, sessionResult));
  }

  if (config.mode === "transform" || config.mode === "both") {
    parts.push(buildTransformed(session.directives, parsed.criticals, config));
  }

  return parts.join("\n\n");
}

function buildReminder(
  directives: string[],
  criticals: string[],
  sessionResult: SessionUpdateResult | null
): string {
  const lines: string[] = [
    "SEMANTIC FORMATTING ACTIVE — HotMarks session:",
  ];

  // Session status
  if (sessionResult?.added.length) {
    lines.push("");
    lines.push("NEW DIRECTIVE(S) ADDED this message:");
    for (const d of sessionResult.added) {
      lines.push(`  + ${d}`);
    }
  }

  if (sessionResult?.rejected.length) {
    lines.push("");
    lines.push("REJECTED (max 4 directives reached — user must clear one first):");
    for (const d of sessionResult.rejected) {
      lines.push(`  ✗ ${d}`);
    }
  }

  if (sessionResult?.removed.length) {
    lines.push("");
    lines.push("REMOVED:");
    for (const d of sessionResult.removed) {
      lines.push(`  - ${d}`);
    }
  }

  if (sessionResult?.cleared) {
    lines.push("");
    lines.push("ALL DIRECTIVES CLEARED.");
  }

  // Active directives (persistent)
  if (directives.length > 0) {
    lines.push("");
    lines.push(`ACTIVE DIRECTIVES (${directives.length}/4) — follow ALL of these:`);
    for (let i = 0; i < directives.length; i++) {
      lines.push(`  ${i + 1}. ${directives[i]}`);
    }
  }

  // Per-message emphasis (not persisted)
  if (criticals.length > 0) {
    lines.push("");
    lines.push("EMPHASIS THIS MESSAGE (not persisted):");
    for (const c of criticals) {
      lines.push(`  ⚡ ${c}`);
    }
  }

  // Acknowledgment instructions
  lines.push("");
  lines.push("ACKNOWLEDGMENT REQUIRED:");
  lines.push("  - State your model name and version (e.g. \"Claude Opus 4.6\").");
  if (sessionResult?.added.length) {
    lines.push('  - For new directives: [Directive received: "<content>"] — will follow exactly.');
  }
  if (sessionResult?.rejected.length) {
    lines.push("  - For rejected: inform user they're at max (4). List active directives. Ask which to remove.");
  }
  if (sessionResult?.removed.length || sessionResult?.cleared) {
    lines.push("  - For removals: confirm what was cleared.");
  }
  if (criticals.length > 0) {
    lines.push('  - For emphasis: [Priority noted: "<content>"] — treating as highest importance.');
  }
  if (directives.length > 0 && !sessionResult?.added.length) {
    lines.push("  - Directives still active — no need to re-acknowledge unless user seems unaware.");
  }
  lines.push("");
  lines.push("STALENESS CHECK: If any active directive seems irrelevant to current task,");
  lines.push("ask user: \"Directive #N seems no longer relevant — clear it?\" Do NOT auto-remove.");

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
  if (prompt === undefined) {
    process.exit(0);
  }

  const cwd = hookInput.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const output = processPrompt(prompt, config, cwd);

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
