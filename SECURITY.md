# Security

Never commit secrets or put credentials in public `VITE_` configuration. CI scans files/history, audits dependencies, and runs CodeQL where available. Reports must omit credentials and private data.

## Patched dependency

As of 2026-10-07, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no published fix. Both shadcn and Stylelint depend on the affected `braces` package through their glob tooling; it is not shipped in the browser. Removing either tool alone does not remove the vulnerability.

[The local patch](patches/braces@3.0.3.patch) limits nesting in parsing and recursive AST operations, rejecting excessive depth with `SyntaxError`. pnpm records its hash and applies it on frozen installs. [Regression tests](scripts/security-patch.test.mjs) verify both tools' actual dependency chains, ordinary patterns, and excessive string/AST depth. This is a local mitigation, not an independent security audit.

Only this advisory is exempted from the registry audit, which cannot detect local patches. Mandatory patch tests prevent retaining the exemption without the mitigation. Other moderate-or-higher advisories block CI.

When an upstream fix is available, upgrade, verify it, and remove the patch, exemption, and patch-specific tests together. Additional exemptions require a separately reviewed mitigation.
