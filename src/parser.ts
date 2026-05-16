export interface ParseResult {
  hasMarkers: boolean;
  directives: string[];
  criticals: string[];
}

export function parseMarkers(text: string): ParseResult {
  const stripped = stripCodeBlocks(text);
  const directives = extractMatches(stripped, /\*\*(.+?)\*\*/g);
  // Remove bold spans before extracting criticals so nested __ inside ** don't double-match
  const strippedBold = stripped.replace(/\*\*(.+?)\*\*/g, (match) =>
    " ".repeat(match.length)
  );
  const criticals = extractMatches(strippedBold, /__(.+?)__/g);

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
