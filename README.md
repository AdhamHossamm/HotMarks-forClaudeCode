# Hotmarks

Semantic formatting plugin for Claude Code. Give your prompts **weight**.

- `**bold text**` = Non-negotiable directive (Claude MUST follow)
- `__underlined text__` = Critical emphasis (highest priority)

## Install

From the Claude Code plugin marketplace:

```bash
/plugin install hotmarks
```

Or load locally during development:

```bash
claude --plugin-dir ./hotmarks
```

The plugin auto-activates on install. No additional setup required.

## Usage

Type markers directly in your Claude Code prompts:

```
Refactor this function **do not change the public API** and focus on __performance is critical__
```

The plugin detects markers on submission and tells Claude to treat them with appropriate authority.

## Configuration

Create a `.hotmarks` file in your project root to customize behavior:

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

If no `.hotmarks` file exists, the plugin uses `reminder` mode with default settings.

## Uninstall

```bash
/plugin uninstall hotmarks
```

## How It Works

1. You type `**text**` or `__text__` in your prompt
2. On submission, the `UserPromptSubmit` hook parses markers (skipping code blocks)
3. Based on your config mode, it outputs semantic context as `additionalContext`
4. Claude receives the context and treats marked text with authority

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Test plugin locally
claude --plugin-dir .
```

## License

MIT
