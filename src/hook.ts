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
  if (prompt === undefined) {
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
