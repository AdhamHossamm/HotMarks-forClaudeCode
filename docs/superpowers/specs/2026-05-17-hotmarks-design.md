# Hotmarks - Semantic Formatting Plugin for Claude Code

**Date:** 2026-05-17
**Status:** Approved
**Package:** `hotmarks`

## Summary

A Claude Code plugin (npm) that gives semantic meaning to markdown formatting in prompts. **Bold** = non-negotiable directive. __Underline__ = critical emphasis. The plugin detects markers on prompt submission and instructs Claude to treat them with special authority.

## Problem

Users have no way to communicate priority or authority within their prompts to Claude Code. Everything is flat text with equal weight. Users need a way to say "this part is a hard rule" vs "this part is critically important" without writing verbose meta-instructions every time.

## Solution

Keyboard shortcuts insert markdown markers into prompt text. A prompt-submit hook detects these markers and injects semantic instructions so Claude treats marked text with appropriate authority.

## Architecture

```
User types prompt
    │
    ├─ Ctrl+Shift+B → wraps selection in **markers**
    ├─ Ctrl+Shift+U → wraps selection in __markers__
    └─ Ctrl+Shift+X → strips all markers from selection
    │
    ▼ submit
Hook: user-prompt-submit
    │
    ├─ Parse for ** and __ markers
    ├─ Load .hotmarks config
    ├─ Skip if no markers found (passthrough)
    │
    ├─ Mode: reminder
    │   └─ Inject system-reminder explaining semantics
    ├─ Mode: transform
    │   └─ Replace markers with [DIRECTIVE:] / [CRITICAL:] tags
    └─ Mode: both
        └─ Inject reminder AND transform markers
    │
    ▼
Claude receives semantically-enriched prompt
```

## Package Structure

```
hotmarks/
├── package.json              # Plugin manifest + bin entry
├── src/
│   ├── hooks/
│   │   └── prompt-submit.ts  # Core hook logic
│   ├── skills/
│   │   └── semantic-formatting.md  # Skill doc
│   ├── cli/
│   │   ├── setup.ts          # Keybinding installer
│   │   └── uninstall.ts      # Keybinding removal
│   └── config/
│       └── loader.ts         # .hotmarks parser + auto-creator
├── tests/
│   ├── prompt-submit.test.ts
│   ├── config-loader.test.ts
│   └── setup.test.ts
├── .hotmarks.default         # Default config template
├── README.md
└── tsconfig.json
```

## Keybindings

| Shortcut | Action | Marker |
|----------|--------|--------|
| Ctrl+Shift+B | Wrap selection in bold | `**text**` |
| Ctrl+Shift+U | Wrap selection in underline | `__text__` |
| Ctrl+Shift+X | Strip all markers from selection | removes `**` and `__` |

Keybindings are registered in `~/.claude/keybindings.json` via the setup command.

## Semantic Meanings

| Marker | Meaning | Behavior |
|--------|---------|----------|
| `**text**` | Non-negotiable directive | Claude MUST follow this exactly |
| `__text__` | Critical emphasis | Highest importance, prioritize this |

## Hook Behavior

### Trigger
`user-prompt-submit` event.

### Logic
1. Receive prompt text
2. Check for `**` and `__` markers (skip content inside fenced code blocks)
3. If no markers found → return unchanged (no injection overhead)
4. Load config from `.hotmarks` (project root → home dir fallback)
5. Apply mode:
   - **reminder**: Prepend system-reminder tag with semantic explanation
   - **transform**: Replace `**text**` with `[DIRECTIVE: text]`, `__text__` with `[CRITICAL: text]`
   - **both**: Do both operations

### System Reminder (reminder mode)
```
<system-reminder>
SEMANTIC FORMATTING ACTIVE:
- Text wrapped in **bold** = NON-NEGOTIABLE DIRECTIVE. Must be followed exactly.
- Text wrapped in __underline__ = CRITICAL EMPHASIS. Highest importance, prioritize above all else.
</system-reminder>
```

### Edge Cases
- Nested markers `**__text__**`: outer wins (directive)
- Markers inside fenced code blocks: ignored
- Incomplete markers (unmatched `**`): ignored, passed through
- Empty markers `****` or `____`: ignored

## Configuration (`.hotmarks`)

Auto-created on plugin install at project root.

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

### Fields
- `mode` (string): `"reminder"` | `"transform"` | `"both"` — default: `"reminder"`
- `markers` (object): Customizable marker syntax — default: `**` and `__`
- `transformTags` (object): Format strings for transform mode — `%s` = extracted text
- `skipCodeBlocks` (boolean): Don't parse inside fenced code blocks — default: `true`

### Resolution Order
1. `.hotmarks` in current project root
2. `~/.hotmarks` in user home directory
3. Built-in defaults

## Install Flow

```bash
# Step 1: Install plugin
claude plugin add hotmarks

# Step 2: Setup keybindings (one-time)
npx hotmarks setup
```

### Setup Command Behavior
1. Detect OS (Windows/Linux)
2. Locate `~/.claude/keybindings.json`
3. Back up existing file to `~/.claude/keybindings.json.hotmarks-backup`
4. Check for conflicts with existing Ctrl+Shift+B/U/X bindings
5. If conflict found → warn user and ask to proceed or skip
6. Merge new keybindings into existing array
7. Auto-create `.hotmarks` config in current directory
8. Print success message with usage instructions

## Uninstall Flow

```bash
# Remove keybindings
npx hotmarks uninstall

# Remove plugin
claude plugin remove hotmarks
```

### Uninstall Command Behavior
1. Restore `keybindings.json` from backup if available
2. Otherwise, remove only hotmarks-specific entries
3. Optionally remove `.hotmarks` config (ask user)

## Skill Definition

The plugin includes a skill file that Claude can reference for context:

```markdown
name: semantic-formatting
description: Detect and respect semantic formatting markers in prompts.
  **bold** = non-negotiable directive. __underline__ = critical emphasis.
  Active when hotmarks plugin is installed.
```

## Platform Support

- **Windows**: Ctrl+Shift+B/U/X keybindings, `%USERPROFILE%\.claude\keybindings.json`
- **Linux**: Ctrl+Shift+B/U/X keybindings, `~/.claude/keybindings.json`
- **macOS**: Not targeted but should work (Cmd+Shift+B/U/X variant possible future addition)

## Testing Strategy

- Unit tests for marker parsing (various edge cases)
- Unit tests for config loading (missing file, partial config, resolution order)
- Integration tests for hook (full prompt → output pipeline)
- CLI tests for setup/uninstall (mock filesystem)

## Non-Goals

- No rich text rendering in terminal (markers stay as plaintext)
- No new semantic meanings beyond directive and critical
- No per-file or per-line granularity — works on full prompt text
- No macOS-specific Cmd variants in v1
