import {
  loadConfig
} from "./chunk-CJF5WE2U.js";

// src/parser.ts
function parseMarkers(text) {
  const stripped = stripCodeBlocks(text);
  const directives = extractMatches(stripped, /\*\*(.+?)\*\*/g);
  const strippedBold = stripped.replace(
    /\*\*(.+?)\*\*/g,
    (match) => " ".repeat(match.length)
  );
  const criticals = extractMatches(strippedBold, /__(.+?)__/g);
  return {
    hasMarkers: directives.length > 0 || criticals.length > 0,
    directives,
    criticals
  };
}
function stripCodeBlocks(text) {
  let result = text.replace(
    /```[\s\S]*?```/g,
    (match) => " ".repeat(match.length)
  );
  result = result.replace(/`[^`]+`/g, (match) => " ".repeat(match.length));
  return result;
}
function extractMatches(text, pattern) {
  const matches = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const content = match[1].trim();
    if (content.length > 0) {
      matches.push(content);
    }
  }
  return matches;
}

// src/session.ts
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
var MAX_DIRECTIVES = 4;
var SESSION_FILE = ".hotmarks-session.json";
function sessionPath(cwd) {
  return join(cwd, SESSION_FILE);
}
function loadSession(cwd) {
  try {
    const raw = readFileSync(sessionPath(cwd), "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data.directives)) {
      return { directives: data.directives.slice(0, MAX_DIRECTIVES) };
    }
  } catch {
  }
  return { directives: [] };
}
function saveSession(cwd, session) {
  writeFileSync(
    sessionPath(cwd),
    JSON.stringify(session, null, 2) + "\n"
  );
}
function updateSession(cwd, newDirectives) {
  const session = loadSession(cwd);
  const result = {
    session,
    added: [],
    rejected: [],
    removed: [],
    cleared: false
  };
  const commands = categorize(newDirectives);
  if (commands.clearAll) {
    result.removed = [...session.directives];
    session.directives = [];
    result.cleared = true;
    saveSession(cwd, session);
    return result;
  }
  for (const target of commands.removals) {
    const idx = session.directives.findIndex(
      (d) => d.toLowerCase() === target.toLowerCase()
    );
    if (idx !== -1) {
      result.removed.push(session.directives[idx]);
      session.directives.splice(idx, 1);
    }
  }
  for (const d of commands.additions) {
    const alreadyExists = session.directives.some(
      (existing) => existing.toLowerCase() === d.toLowerCase()
    );
    if (alreadyExists) continue;
    if (session.directives.length >= MAX_DIRECTIVES) {
      result.rejected.push(d);
    } else {
      session.directives.push(d);
      result.added.push(d);
    }
  }
  result.session = session;
  saveSession(cwd, session);
  return result;
}
function categorize(directives) {
  const additions = [];
  const removals = [];
  let clearAll = false;
  for (const d of directives) {
    if (d === "!clear" || d === "!clear-all") {
      clearAll = true;
    } else if (d.startsWith("!remove:")) {
      const target = d.slice("!remove:".length).trim();
      if (target) removals.push(target);
    } else {
      additions.push(d);
    }
  }
  return { additions, removals, clearAll };
}

// src/hook.ts
function processPrompt(prompt, config, cwd) {
  const parsed = parseMarkers(prompt);
  const workingDir = cwd ?? process.cwd();
  let sessionResult = null;
  if (parsed.directives.length > 0) {
    sessionResult = updateSession(workingDir, parsed.directives);
  }
  const session = sessionResult?.session ?? loadSession(workingDir);
  const hasActiveDirectives = session.directives.length > 0;
  const hasCriticals = parsed.criticals.length > 0;
  if (!hasActiveDirectives && !hasCriticals && !sessionResult?.cleared && !sessionResult?.removed.length) {
    return null;
  }
  const parts = [];
  if (config.mode === "reminder" || config.mode === "both") {
    parts.push(buildReminder(session.directives, parsed.criticals, sessionResult));
  }
  if (config.mode === "transform" || config.mode === "both") {
    parts.push(buildTransformed(session.directives, parsed.criticals, config));
  }
  return parts.join("\n\n");
}
function buildReminder(directives, criticals, sessionResult) {
  const lines = [
    "SEMANTIC FORMATTING ACTIVE \u2014 HotMarks session:"
  ];
  if (sessionResult?.added.length) {
    lines.push("");
    lines.push("NEW DIRECTIVE(S) ADDED this message:");
    for (const d of sessionResult.added) {
      lines.push(`  + ${d}`);
    }
  }
  if (sessionResult?.rejected.length) {
    lines.push("");
    lines.push("REJECTED (max 4 directives reached \u2014 user must clear one first):");
    for (const d of sessionResult.rejected) {
      lines.push(`  \u2717 ${d}`);
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
  if (directives.length > 0) {
    lines.push("");
    lines.push(`ACTIVE DIRECTIVES (${directives.length}/4) \u2014 follow ALL of these:`);
    for (let i = 0; i < directives.length; i++) {
      lines.push(`  ${i + 1}. ${directives[i]}`);
    }
  }
  if (criticals.length > 0) {
    lines.push("");
    lines.push("EMPHASIS THIS MESSAGE (not persisted):");
    for (const c of criticals) {
      lines.push(`  \u26A1 ${c}`);
    }
  }
  lines.push("");
  lines.push("ACKNOWLEDGMENT REQUIRED:");
  lines.push('  - State your model name and version (e.g. "Claude Opus 4.6").');
  if (sessionResult?.added.length) {
    lines.push('  - For new directives: [Directive received: "<content>"] \u2014 will follow exactly.');
  }
  if (sessionResult?.rejected.length) {
    lines.push("  - For rejected: inform user they're at max (4). List active directives. Ask which to remove.");
  }
  if (sessionResult?.removed.length || sessionResult?.cleared) {
    lines.push("  - For removals: confirm what was cleared.");
  }
  if (criticals.length > 0) {
    lines.push('  - For emphasis: [Priority noted: "<content>"] \u2014 treating as highest importance.');
  }
  if (directives.length > 0 && !sessionResult?.added.length) {
    lines.push("  - Directives still active \u2014 no need to re-acknowledge unless user seems unaware.");
  }
  lines.push("");
  lines.push("STALENESS CHECK: If any active directive seems irrelevant to current task,");
  lines.push('ask user: "Directive #N seems no longer relevant \u2014 clear it?" Do NOT auto-remove.');
  return lines.join("\n");
}
function buildTransformed(directives, criticals, config) {
  const lines = ["Semantic markers extracted:"];
  for (const d of directives) {
    lines.push(config.transformTags.directive.replace("%s", d));
  }
  for (const c of criticals) {
    lines.push(config.transformTags.critical.replace("%s", c));
  }
  return lines.join("\n");
}
async function main() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  let hookInput;
  try {
    hookInput = JSON.parse(input);
  } catch {
    process.exit(0);
  }
  const prompt = hookInput.prompt;
  if (prompt === void 0) {
    process.exit(0);
  }
  const cwd = hookInput.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const output = processPrompt(prompt, config, cwd);
  if (output) {
    process.stdout.write(output);
  }
}
var isMainModule = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("hook.js");
if (isMainModule) {
  main();
}
export {
  processPrompt
};
