import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const MAX_DIRECTIVES = 4;
const SESSION_FILE = ".hotmarks-session.json";

export interface SessionData {
  directives: string[];
}

function sessionPath(cwd: string): string {
  return join(cwd, SESSION_FILE);
}

export function loadSession(cwd: string): SessionData {
  try {
    const raw = readFileSync(sessionPath(cwd), "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data.directives)) {
      return { directives: data.directives.slice(0, MAX_DIRECTIVES) };
    }
  } catch {}
  return { directives: [] };
}

export function saveSession(cwd: string, session: SessionData): void {
  writeFileSync(
    sessionPath(cwd),
    JSON.stringify(session, null, 2) + "\n"
  );
}

export interface SessionUpdateResult {
  session: SessionData;
  added: string[];
  rejected: string[];
  removed: string[];
  cleared: boolean;
}

export function updateSession(
  cwd: string,
  newDirectives: string[]
): SessionUpdateResult {
  const session = loadSession(cwd);
  const result: SessionUpdateResult = {
    session,
    added: [],
    rejected: [],
    removed: [],
    cleared: false,
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

interface CategorizedCommands {
  additions: string[];
  removals: string[];
  clearAll: boolean;
}

function categorize(directives: string[]): CategorizedCommands {
  const additions: string[] = [];
  const removals: string[] = [];
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
