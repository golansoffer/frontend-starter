import { globSync, readFileSync } from 'node:fs'
import { extname, relative } from 'node:path'

import ts from 'typescript'

// Repository policies that Oxlint does not expose as configurable native rules.
// Parse comments so examples inside strings cannot be mistaken for directives.
export function findPolicyViolations(filename, source) {
  const path = relative(process.cwd(), filename).replaceAll('\\', '/')
  const violations = []
  if (path.startsWith('src/') && !['.ts', '.tsx'].includes(extname(path))) {
    violations.push('Application code must be TypeScript (.ts or .tsx).')
  }

  const ast = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
  )
  const comments = new Set()
  function visit(node) {
    if (
      path.startsWith('src/') &&
      !path.startsWith('src/routes/') &&
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal) &&
      /^@tanstack\/(react-router|router-core|history)(\/|$)/u.test(
        node.argument.literal.text,
      )
    ) {
      violations.push(
        'Use named Router type imports so the route boundary allowlist applies.',
      )
    }
    if (ts.isEnumDeclaration(node)) {
      violations.push('Use a union or an as-const object instead of an enum.')
    }
    if (path === 'src/app/router.tsx' && ts.isInterfaceDeclaration(node)) {
      const registration =
        node.name.text === 'Register' &&
        ts.isModuleBlock(node.parent) &&
        ts.isModuleDeclaration(node.parent.parent) &&
        node.parent.parent.name.text === '@tanstack/react-router'
      if (!registration) {
        violations.push(
          'Use type; only TanStack Register declaration merging requires an interface.',
        )
      }
    }
    if (ts.isPropertySignature(node)) {
      const name = ts.isComputedPropertyName(node.name)
        ? node.name.expression
        : node.name
      if (
        (ts.isIdentifier(name) || ts.isStringLiteral(name)) &&
        name.text === 'kind' &&
        (node.questionToken ||
          !node.type ||
          !ts.isLiteralTypeNode(node.type) ||
          !ts.isStringLiteral(node.type.literal))
      ) {
        violations.push(
          'Each kind must be one required string literal. Use separate union members for distinct states.',
        )
      }
    }
    for (const range of [
      ...(ts.getLeadingCommentRanges(source, node.getFullStart()) ?? []),
      ...(ts.getTrailingCommentRanges(source, node.getEnd()) ?? []),
    ]) {
      if (comments.has(range.pos)) {
        continue
      }
      comments.add(range.pos)
      const comment = source.slice(range.pos + 2, range.end)
      if (/^\s*(?:oxlint|eslint)(?:-(?:disable|enable)\b|\s)/u.test(comment)) {
        const { line } = ast.getLineAndCharacterOfPosition(range.pos)
        violations.push(
          `Line ${line + 1}: inline lint configuration is forbidden.`,
        )
      }
    }
    for (const child of node.getChildren(ast)) {
      visit(child)
    }
  }
  visit(ast)
  return violations
}

if (import.meta.main) {
  const files = globSync(
    [
      'src/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}',
      'e2e/**/*.ts',
      'scripts/*.mjs',
      'config/**/*.{ts,mts,cts,js,mjs,cjs}',
      '*.{ts,mts,cts,js,mjs,cjs}',
    ],
    { exclude: ['src/components/ui/**', 'src/routeTree.gen.ts'] },
  )
  for (const file of files) {
    const violations = findPolicyViolations(file, readFileSync(file, 'utf8'))
    for (const violation of violations) {
      process.stderr.write(`${file}: ${violation}\n`)
      process.exitCode = 1
    }
  }
}
