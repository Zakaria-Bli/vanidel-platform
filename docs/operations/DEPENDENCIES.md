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

| Override                      | Current consumers and purpose                                                                                                                                                   | Removal condition                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `body-parser: ^2.4.0`         | Express server used by shadcn's MCP SDK; fix GHSA-27r3-jxmh-p828 within Express's compatible 2.x range.                                                                         | Upstream constraints guarantee the same or a higher patched floor without the override.                          |
| `dompurify: ^3.4.17`          | Monaco/Payload UI's HTML sanitizer; fix GHSA-cg2g-xh64-v4q7 and GHSA-mrv2-3pqr-j5jr within 3.x.                                                                                 | Upstream constraints guarantee the same or a higher patched floor without the override.                          |
| `esbuild: ^0.25.0`            | Drizzle migration tooling, TypeScript loaders, and Vite; keep older transitive constraints on the 0.25 line.                                                                    | Every upstream consumer resolves a suitable version without the override; verify migration generation and tests. |
| `fast-uri: ^3.1.9`            | Payload/ajv and tooling validators; fix GHSA-w74x-v6f9-j3xg and GHSA-wjr9-j795-jxcr within 3.x.                                                                                 | Upstream constraints guarantee the same or a higher patched floor without the override.                          |
| `graphql-scalars: ^2.0.1`     | Payload's GraphQL API (`DateTimeResolver`, `EmailAddressResolver`); fix GHSA-x8rm-f576-gq67. Crosses Payload's pinned 1.22.2; 2.x keeps both resolvers and supports graphql 16. | Payload depends on a patched release; verify `/api/graphql` dates and emails after removal.                      |
| `happy-dom: ^21.0.4`          | Lexical/Payload and Vitest DOM environment; patched in 21.0.4 for GHSA-834v-8h66-3h79.                                                                                          | Remove when upstream provides a patched 20.x release or formally supports patched 21.x.                          |
| `ip-address: ^10.7.4`         | shadcn's `socks` and MCP SDK paths; fix GHSA-rxp7-6hxx-x8q5 within 10.x.                                                                                                        | Upstream constraints guarantee the same or a higher patched floor without the override.                          |
| `qs: ^6.16.1`                 | Express used by shadcn's MCP SDK; fix GHSA-6pq8-jhm2-2vcw within 6.x.                                                                                                           | Upstream constraints guarantee the same or a higher patched floor without the override.                          |
| `systeminformation: ^5.33.16` | shadcn's `@dotenvx/dotenvx`; fix GHSA-3f7j-7jwc-fxfj within 5.x.                                                                                                                | Upstream constraints guarantee the same or a higher patched floor without the override.                          |
| `undici: ^7.30.1`             | Payload and test tooling's HTTP client; fix GHSA-xjj6-f33q-929c, GHSA-4qv8-2p9j-2685, and GHSA-f72v-6w45-q472.                                                                  | Upstream constraints guarantee the same or a higher patched floor without the override.                          |
| `zod: ^4.6.7`                 | shadcn/MCP SDK validation; the SDK accepts Zod 4, patched for GHSA-mrhx-c7xc-m3w5.                                                                                              | Upstream constraints guarantee a patched Zod version without overriding consumers' compatible ranges.            |

Use `pnpm why body-parser dompurify esbuild fast-uri graphql-scalars happy-dom ip-address qs systeminformation undici zod` to inspect consumers. When changing an override, run frozen installation from the updated lockfile, lint, formatting, type checking, integration tests, migration generation/drift checks, dependency audit, and a production build. Review consumers before crossing an upstream major range; validate any such override with the full suite.

## ESLint 10 compatibility review

Reviewed 24 October 2026 for [Dependabot PR #45](https://github.com/Zakaria-Bli/vanidel-platform/pull/45), following the earlier review for [PR #23](https://github.com/Zakaria-Bli/vanidel-platform/pull/23). Keep `eslint` and `@eslint/js` at `9.39.5`; the ESLint 10 update is not peer-compatible with the plugins bundled by `eslint-config-next@16.4.2`.

Next.js documents support for ESLint 9 and 10, and Node.js 24 meets ESLint 10's engine requirement. However, the versions bundled by `eslint-config-next@16.4.2` still have these published ESLint peer constraints:

| Package                  | Locked version | Published ESLint peer range                                      | ESLint 10 accepted? |
| ------------------------ | -------------- | ---------------------------------------------------------------- | ------------------- |
| `eslint-plugin-react`    | `7.37.5`       | `^3 \|\| ^4 \|\| ^5 \|\| ^6 \|\| ^7 \|\| ^8 \|\| ^9.7`           | No                  |
| `eslint-plugin-jsx-a11y` | `6.10.2`       | `^3 \|\| ^4 \|\| ^5 \|\| ^6 \|\| ^7 \|\| ^8 \|\| ^9`             | No                  |
| `eslint-plugin-import`   | `2.32.0`       | `^2 \|\| ^3 \|\| ^4 \|\| ^5 \|\| ^6 \|\| ^7.2.0 \|\| ^8 \|\| ^9` | No                  |

`eslint-config-next@16.4.2` itself, `eslint-plugin-react-hooks@7.1.1`, `typescript-eslint@8.71.1`, and `@eslint/compat@2.1.1` accept ESLint 10. The existing `fixupConfigRules()` wrappers address legacy rule APIs, but do not change the three plugins' declared peer support. `@eslint/js@10.0.1` also requires ESLint `^10.0.0`, so it must not be upgraded independently while ESLint 9 is retained.

Revisit an ESLint 10 upgrade when the dependency chain declares compatible peer ranges. Then review the [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0), test the effective Next.js/TypeScript rules and autofixes, and rerun the full validation suite. Do not add peer-dependency exceptions, force a framework/plugin update, or weaken lint or audit rules to make this rollup pass.

The rollup updates `eslint-config-next` to `16.4.2`, but retains the same incompatible `eslint-plugin-react@7.37.5`, `eslint-plugin-jsx-a11y@6.10.2`, and `eslint-plugin-import@2.32.0` peer ranges. A non-strict install and passing lint run do not make those declared peers compatible. To reproduce the review, query each exact locked version with `pnpm view <package>@<version> peerDependencies --json`. The [Next.js ESLint guide](https://nextjs.org/docs/app/api-reference/config/eslint) documents the bundled-plugin peer warning caveat.

## Toolchain conventions

- Node.js is selected by `.node-version`; pnpm is pinned in `package.json` and CI.
- CI installs with `--frozen-lockfile`. Commit lockfile changes with dependency changes.
- Dependency install scripts are explicitly allowed in `pnpm-workspace.yaml`.
- pnpm 11 settings belong in `pnpm-workspace.yaml`; `.npmrc` is not needed for the current public registry setup.
- Related Payload, Next.js, React, and testing updates are grouped by Dependabot.
