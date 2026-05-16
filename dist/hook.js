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

// src/hook.ts
function processPrompt(prompt, config) {
  const parsed = parseMarkers(prompt);
  if (!parsed.hasMarkers) return null;
  const parts = [];
  if (config.mode === "reminder" || config.mode === "both") {
    parts.push(buildReminder(parsed.directives, parsed.criticals));
  }
  if (config.mode === "transform" || config.mode === "both") {
    parts.push(buildTransformed(parsed.directives, parsed.criticals, config));
  }
  return parts.join("\n\n");
}
function buildReminder(directives, criticals) {
  const lines = [
    "SEMANTIC FORMATTING ACTIVE in this prompt:"
  ];
  if (directives.length > 0) {
    lines.push("");
    lines.push("NON-NEGOTIABLE DIRECTIVE(S) \u2014 must be followed exactly:");
    for (const d of directives) {
      lines.push(`  - ${d}`);
    }
  }
  if (criticals.length > 0) {
    lines.push("");
    lines.push("CRITICAL EMPHASIS \u2014 highest importance, prioritize above all else:");
    for (const c of criticals) {
      lines.push(`  - ${c}`);
    }
  }
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
  const output = processPrompt(prompt, config);
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
