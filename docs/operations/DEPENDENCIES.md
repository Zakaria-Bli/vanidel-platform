# Dependency maintenance

Owner: the repository's technical maintainer. Review these decisions in dependency-update pull requests and at the scheduled date below. Keep `pnpm-workspace.yaml`, the lockfile, and this document consistent.

## Accepted audit exception

- Advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), stack-exhaustion denial of service in `braces`.
- Installed version: `3.0.3`.
- Last reviewed: 10 October 2026. Next review: 10 November 2026, or immediately when a fix is published.
- The advisory lists no patched release as of the review date.
- Dependency paths include `sass → chokidar → braces` through Next.js/Payload tooling and `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.
- The current application does not pass public request input to brace/glob processing. The relevant consumers process configured filesystem patterns. Some consumers are production dependencies, so this is not classified as development-only exposure.
- Decision: retain the narrowly scoped GHSA exception while no patch exists. An audit passing with this exception does not mean the tree has no vulnerabilities.
- Remove the exception once a compatible fixed dependency chain is available. Reassess exposure if request-driven pattern matching is introduced. Verify with `pnpm why braces` and `pnpm audit:dependencies` after updates.

## Transitive dependency overrides

These overrides impose minimum versions on framework/tooling dependencies that can otherwise resolve older releases. They preserve the existing security floors rather than changing direct framework versions.

| Override             | Current consumers and purpose                                                                                | Removal condition                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `dompurify: ^3.4.16` | Monaco/Payload UI's HTML sanitizer; require the 3.x line at or above version 3.4.16.                         | Upstream constraints guarantee the same or a higher floor without the override.                                  |
| `esbuild: ^0.25.0`   | Drizzle migration tooling, TypeScript loaders, and Vite; keep older transitive constraints on the 0.25 line. | Every upstream consumer resolves a suitable version without the override; verify migration generation and tests. |
| `undici: ^7.29.1`    | Payload and test tooling's HTTP client; require the 7.x line at or above this floor.                         | Upstream constraints guarantee the same or a higher floor; verify Payload initialization and tests.              |

Use `pnpm why dompurify esbuild undici` to inspect consumers. When changing an override, run frozen installation from the updated lockfile, lint, formatting, type checking, integration tests, migration generation/drift checks, dependency audit, and a production build. Do not raise major versions solely to silence the audit without checking consumers.

## Toolchain conventions

- Node.js is selected by `.node-version`; pnpm is pinned in `package.json` and CI.
- CI installs with `--frozen-lockfile`. Commit lockfile changes with dependency changes.
- Dependency install scripts are explicitly allowed in `pnpm-workspace.yaml`.
- pnpm 11 settings belong in `pnpm-workspace.yaml`; `.npmrc` is not needed for the current public registry setup.
- Related Payload, Next.js, React, and testing updates are grouped by Dependabot.
