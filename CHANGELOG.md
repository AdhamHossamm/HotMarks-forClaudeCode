# Changelog

All notable changes to HotMarks are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2025-05-17

### Fixed

- Resolve broken banner image on npm by using absolute raw.githubusercontent.com URL

## [0.0.2] - 2025-05-17

### Added

- Persistent directives with session state tracking
- Self-hosted plugin marketplace manifest for distribution
- CI: GitHub Actions workflows for CI, release automation, and Dependabot
- CI: npm auto-publish to release workflow with repository linking
- CI: npm Trusted Publishing with OIDC provenance

### Fixed

- Resolve config race condition and prompt validation bugs (TOCTOU race, falsy prompt check)
- Correct plugin manifest version and repo URL

### Changed

- Upgrade vitest 2 to 4, fix esbuild/vite vulnerabilities
- Add .npmignore to exclude banners, tests, and IDE files from package
- Exclude banners from version control

## [0.0.1] - 2025-05-17

### Added

- Project scaffold with TypeScript, tsup, and vitest
- Marker parser for **bold** directives and __underline__ emphasis with code block skipping
- Config loader with project and home directory fallback resolution order
- Prompt-submit hook with reminder, transform, and inject output modes
- Skill definition for Claude context awareness (semantic-formatting)
- CLI for setup and uninstall commands
- Banner designs and media assets

### Fixed

- Restructure as proper Claude Code plugin with hooks.json manifest
- Include dist/ in repo for plugin runtime

[0.0.3]: https://github.com/AdhamHossamm/HotMarks-forClaudeCode/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/AdhamHossamm/HotMarks-forClaudeCode/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/AdhamHossamm/HotMarks-forClaudeCode/releases/tag/v0.0.1
