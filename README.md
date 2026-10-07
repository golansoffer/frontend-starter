# Frontend starter

React, strict TypeScript, TanStack Router/Query/Form, Zod, and stock shadcn Base UI. Vite builds it; Oxlint is the only JS/TS linter. [AGENTS.md](AGENTS.md) defines the working rules.

## Start

Use this as a GitHub template, or copy without `.git`, `node_modules`, `.tools`, and generated build/test output. Keep dotfiles, the lockfile, `.github`, `.husky`, and the generated route tree.

1. Install the pnpm version in [package.json](package.json)'s `packageManager`. pnpm downloads and uses the project's Node version from [pnpm-workspace.yaml](pnpm-workspace.yaml); your global Node version is unchanged.
2. Rename the package and `index.html` title. `.env.example` is optional. For a plain folder copy, run `git init` before installing so Git hooks work.
3. Run:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. Before full verification, run `pnpm exec playwright install chromium firefox webkit` (add `--with-deps` on Linux).

## Work

| Command                         | Purpose                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm check`                    | Types, lint, CSS, formatting, dependency boundaries, guard tests, coverage, build |
| `pnpm check:all`                | Also browser tests and dependency audit                                           |
| `pnpm test`                     | Unit tests in watch mode                                                          |
| `pnpm test:e2e:ui`              | Interactive browser tests                                                         |
| `pnpm lint:fix` / `pnpm format` | Mechanical fixes                                                                  |
| `pnpm ui:add <component>`       | Add stock shadcn components                                                       |

The project and profile features are independent. Nested routes render `/` and `/profile` through the shared layout's `Outlet`. The project hook supplies a controlled view; its response schema adapts API fields before Query caches them. Form owns drafts, and the form only validates—it sends or saves nothing. Remove these examples, their public JSON, and related tests together when replacing them.

## Checks and limits

Strict types, typed Oxlint, accessibility rules, Stylelint, dependency boundaries, unused-code checks, and behavior tests run locally and in CI. Prettier and Knip settings live in [package.json](package.json); build, unit tests, and coverage share [vite.config.ts](vite.config.ts). Supporting checks live in `config/`, browser configuration in `e2e/`, and CI/security configuration in `.github/`. Generated UI is excluded from lint/format/unused-export checks to preserve upstream source; it remains typechecked and browser-tested.

Official TanStack, Testing Library, and Playwright lint plugins run inside Oxlint. Their package names reference ESLint; no ESLint runner or configuration is used. [Oxlint's JS plugin support](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) cannot run rules needing TypeScript parser services: Query's `no-void-query-fn` is unavailable, and `no-rest-destructuring` cannot recognize every custom wrapper.

Pre-commit runs lint, formatting, and CSS checks; pre-push runs `pnpm check`. CI also runs browsers, audit, secret scanning, and eligible CodeQL analysis. Hooks are bypassable; enforce merges with repository settings. Tests and lint cannot prove good design or complete accessibility. One locally patched dependency has an audit exception; see [SECURITY.md](SECURITY.md).

## Activate on GitHub

1. Push and enable Actions. Mark as a **Template repository** to enable “Use this template.”
2. Import [.github/rulesets/main.json](.github/rulesets/main.json) under **Settings → Rules → Rulesets** and activate it without bypass actors. It requires CI checks and another approving reviewer after the last push. Solo maintainers must adjust review requirements explicitly while retaining checks and branch protection.
3. Add actual maintainers to `CODEOWNERS` for workflows, quality config, lockfiles, and working rules; enable code-owner review. Enable secret scanning/push protection and Dependabot alerts where supported. For private repositories with GitHub Code Security, set `ENABLE_CODEQL=true`, then require its result.

Repository settings are not activated by copying files; availability depends on the GitHub plan and visibility.

## Deploy

Publish `dist/` after `pnpm build`. Configure HTTPS, security headers, and an `index.html` fallback for application routes; preserve real asset/API 404s. The starter assumes the origin root; subpath hosting requires Router/Vite base-path changes and browser tests.

Choose your project's license before distribution and retain [third-party notices](THIRD_PARTY_NOTICES.md).
