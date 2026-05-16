# Contributing to Hotmarks

Thanks for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Run tests: `npm test`
5. Make your changes
6. Run tests again to verify nothing broke
7. Submit a pull request

## Development

```bash
npm install       # Install deps
npm test          # Run tests
npm run build     # Build dist/
claude --plugin-dir .  # Test locally in Claude Code
```

## Pull Requests

- Keep PRs focused on a single change
- Add tests for new functionality
- Ensure all tests pass before submitting
- Update README if you change user-facing behavior
- Follow existing code style (TypeScript, ESM)

## Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (OS, Node version, Claude Code version)

## Code Style

- TypeScript with strict mode
- ESM modules
- No comments unless explaining non-obvious "why"
- Pure functions where possible

## Testing

We use Vitest. Follow TDD:
1. Write a failing test
2. Implement the fix
3. Verify the test passes

Run the full suite with `npm test`.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
