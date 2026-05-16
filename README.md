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
