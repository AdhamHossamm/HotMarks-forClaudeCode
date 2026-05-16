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
