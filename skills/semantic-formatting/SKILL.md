---
name: semantic-formatting
description: Detect and respect semantic formatting markers in prompts. **bold** = non-negotiable directive (persistent, max 4). __underline__ = critical emphasis (per-message). Active when hotmarks plugin is installed.
user-invocable: false
---

# Semantic Formatting

When this plugin is active, the user's prompts may contain semantic markers:

## Markers

| Syntax | Meaning | Persistence | Your behavior |
|--------|---------|-------------|---------------|
| `**text**` | Non-negotiable directive | Session-persistent (max 4) | You MUST follow this exactly. No deviation. |
| `__text__` | Critical emphasis | This message only | Treat as highest priority for this response. |

## Directives (Persistent)

- Directives are stored in session and re-injected every message until cleared.
- Maximum 4 active directives at any time.
- If user tries to add a 5th: inform them they're at capacity, list all 4, ask which to remove.
- User clears with: `**!clear**` (all) or `**!remove: text**` (specific one).
- Claude can also edit `.hotmarks-session.json` directly after user confirms removal.

## Emphasis (Per-Message)

- Emphasis markers apply only to the current response.
- No persistence — they don't carry to next message.
- No limit on emphasis markers per message.

## Acknowledgment

When the hook injects markers, acknowledge them:
- New directive added: `[Directive received: "<content>"] — will follow exactly.`
- Directive rejected (at max): inform user, list active 4, ask which to clear.
- Directive removed/cleared: confirm what was removed.
- Emphasis: `[Priority noted: "<content>"] — treating as highest importance.`
- Pre-existing directives (no new ones): no re-acknowledgment needed unless user seems unaware.

## Staleness Check

If an active directive seems irrelevant to the current conversation direction:
1. Ask user: "Directive #N ('<content>') seems no longer relevant — should I clear it?"
2. Do NOT auto-remove. Wait for confirmation.
3. If confirmed, edit `.hotmarks-session.json` to remove it.

## Rules

1. Directives are absolute constraints that cannot be violated.
2. Emphasis = highest priority for that single response.
3. Unmarked text has normal priority.
4. If a directive contradicts an emphasis, the directive wins (it's non-negotiable and persistent).
5. All 4 active directives apply simultaneously — they are additive constraints.

## Examples

User writes: "Refactor this function **do not change the public API** and __make sure tests still pass__"

Your behavior:
- [Directive received: "do not change the public API"] — will follow exactly.
- [Priority noted: "make sure tests still pass"] — treating as highest importance.
- "Refactor this function" → normal instruction, execute within constraints

Next message (no new markers): "Now optimize the loop"
- Directive "do not change the public API" still active — still constrains your work.
- No acknowledgment needed since it's pre-existing.
