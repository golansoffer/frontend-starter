import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { after, test } from 'node:test'

import ts from 'typescript'
import stylelint from 'stylelint'

import { findPolicyViolations } from './check-source-policy.mjs'

const require = createRequire(import.meta.url)
const oxlint = join(
  dirname(require.resolve('oxlint/package.json')),
  'bin/oxlint',
)
const directories = [
  mkdtempSync(resolve('src/__lint-probe-')),
  mkdtempSync(resolve('e2e/__lint-probe-')),
  mkdtempSync(resolve('src/routes/-lint-probe-')),
  mkdtempSync(resolve('src/features/__architecture-probe-')),
  mkdtempSync(resolve('src/components/ui/__architecture-probe-')),
  mkdtempSync(resolve('__architecture-probe-')),
]
const fixtures = []

after(() => {
  for (const filename of fixtures) {
    unlinkSync(filename)
  }
  for (const directory of directories.toReversed()) {
    rmdirSync(directory)
  }
})

const probes = [
  [
    'interface.ts',
    'export interface Props { name: string }',
    'typescript(consistent-type-definitions)',
  ],
  [
    'method-signature.ts',
    'export type Handler = { onChange(value: string): void }',
    'typescript(method-signature-style)',
  ],
  ...[
    'useSearch',
    'useParams',
    'useLoaderData',
    'useRouteContext',
    'useNavigate',
    'useRouter',
    'useRouterState',
    'getRouteApi',
  ].map((name) => [
    `router-${name}.ts`,
    `export { ${name} as leaked } from "@tanstack/react-router"`,
    'eslint(no-restricted-imports)',
  ]),
  [
    'router-namespace.ts',
    'import * as routing from "@tanstack/react-router"; export { routing }',
    'eslint(no-restricted-imports)',
  ],
  [
    'router-type.ts',
    'export type { NavigateOptions } from "@tanstack/react-router"',
    'eslint(no-restricted-imports)',
  ],
  [
    'any.ts',
    'export function identity(value: any) { return value }',
    'typescript(no-explicit-any)',
  ],
  [
    'assertion.ts',
    'export const value = JSON.parse("{}") as { name: string }',
    'typescript(consistent-type-assertions)',
  ],
  ['floating.ts', 'Promise.resolve(1)', 'typescript(no-floating-promises)'],
  ['voided.ts', 'void Promise.resolve(1)', 'typescript(no-floating-promises)'],
  [
    'redundant-promise.ts',
    'export async function request() { return Promise.resolve({ value: 1 }) }',
    'unicorn(no-useless-promise-resolve-reject)',
  ],
  [
    'redundant-rejection.ts',
    'export const request = async () => Promise.reject(new Error("Failed"))',
    'unicorn(no-useless-promise-resolve-reject)',
  ],
  [
    'unnecessary-async.ts',
    'export async function count() { return 1 }',
    'typescript(require-await)',
  ],
  [
    'effect.tsx',
    'import { useEffect as synchronize } from "react"; export function Example() { synchronize(() => { document.title = "Example" }, []); return null }',
    'eslint(no-restricted-imports)',
  ],
  [
    'namespace-effect.tsx',
    'import * as R from "react"; export function Example() { R.useEffect(() => { document.title = "Example" }, []); return null }',
    'eslint(no-restricted-imports)',
  ],
  [
    'default-effect.tsx',
    'import R from "react"; export function Example() { R.useEffect(() => { document.title = "Example" }, []); return null }',
    'eslint(no-restricted-imports)',
  ],
  [
    'layout-effect.tsx',
    'import { useLayoutEffect } from "react"; export function Example() { useLayoutEffect(() => { document.title = "Example" }, []); return null }',
    'eslint(no-restricted-imports)',
  ],
  [
    'insertion-effect.tsx',
    'import { useInsertionEffect } from "react"; export function Example() { useInsertionEffect(() => { document.title = "Example" }, []); return null }',
    'eslint(no-restricted-imports)',
  ],
  [
    'history.ts',
    'history.pushState({}, "", "/?view=profile")',
    'eslint(no-restricted-properties)',
  ],
  [
    'search-params.ts',
    'export const search = new URLSearchParams("view=profile")',
    'eslint(no-restricted-globals)',
  ],
  [
    'inline-style.tsx',
    'export function Example() { return <p style={{ color: "red" }}>Styled</p> }',
    'react(forbid-dom-props)',
  ],
  [
    'clickable-div.tsx',
    'export function Example() { return <div onClick={() => 1}>Action</div> }',
    'jsx-a11y(no-static-element-interactions)',
  ],
  [
    'quadratic.ts',
    'export function index(items: string[]) { return items.reduce((all, item) => ({ ...all, [item]: item }), {}) }',
    'oxc(no-accumulating-spread)',
  ],
  [
    'suppression.ts',
    '// @ts-ignore\nexport const value = 1',
    'typescript(ban-ts-comment)',
  ],
  ...['ts-nocheck', 'ts-expect-error'].map((directive) => [
    `${directive}.ts`,
    `// @${directive}\nexport const value: string = 1`,
    'typescript(ban-ts-comment)',
  ]),
  [
    'nonnull.ts',
    'export const value = document.querySelector("main")!',
    'typescript(no-non-null-assertion)',
  ],
  [
    'unsafe.ts',
    'export const value = JSON.parse("{}")',
    'typescript(no-unsafe-assignment)',
  ],
  [
    'unsafe-return.ts',
    'export function read(): string { return JSON.parse("{}"); }',
    'typescript(no-unsafe-return)',
  ],
  [
    'unsafe-argument.ts',
    'export const value = Math.abs(JSON.parse("{}"))',
    'typescript(no-unsafe-argument)',
  ],
  [
    'switch.ts',
    'export function label(value: "a" | "b") { switch (value) { case "a": return "A" } }',
    'typescript(switch-exhaustiveness-check)',
  ],
  [
    'switch-fallback.ts',
    'export function label(value: "a" | "b") { switch (value) { case "a": return "A"; default: return "unknown" } }',
    'typescript(switch-exhaustiveness-check)',
  ],
  [
    'branching.ts',
    `export function label(value: number) { ${Array.from({ length: 13 }, (_, i) => `if (value === ${i}) { return "${i}" }`).join(' ')} return "other" }`,
    'eslint(complexity)',
  ],
  [
    'router-import.ts',
    'import { Link } from "react-router"; export { Link }',
    'eslint(no-restricted-imports)',
  ],
  [
    'hooks.tsx',
    'import { useState } from "react"; export function Broken({ enabled }: { enabled: boolean }) { if (enabled) { useState(0) } return null }',
    'react-hooks(rules-of-hooks)',
  ],
  [
    'image.tsx',
    'export function Picture() { return <img src="/image.png" /> }',
    'jsx-a11y(alt-text)',
  ],
  [
    'query.ts',
    'import { useQuery } from "@tanstack/react-query"; export function useItem(id: string) { return useQuery({ queryKey: ["item"], queryFn: () => Promise.resolve(id) }) }',
    '@tanstack/query(exhaustive-deps)',
  ],
  [
    'route-params.ts',
    'import { createFileRoute } from "@tanstack/react-router"; export const Route = createFileRoute("/$invalid-param")({})',
    '@tanstack/router(route-param-names)',
  ],
  [
    'focused.test.ts',
    'import { expect, test } from "vitest"; test.only("focused", () => { expect(1).toBe(1) })',
    'vitest(no-focused-tests)',
  ],
  [
    'skipped.test.ts',
    'import { expect, test } from "vitest"; test.skip("skipped", () => { expect(1).toBe(1) })',
    'vitest(no-disabled-tests)',
  ],
  [
    'dom.test.tsx',
    'import { render } from "@testing-library/react"; import { expect, test } from "vitest"; test("DOM", () => { render(<div />); expect(document.querySelector("div")).not.toBeNull() })',
    'testing-library(no-node-access)',
  ],
  [
    'browser.ts',
    'import { expect, test } from "@playwright/test"; test.only("focused", async ({ page }) => { await expect(page).toHaveTitle("test") })',
    'playwright(no-focused-test)',
    1,
  ],
]

function fixture(name, source, directory = directories[0]) {
  const filename = join(directory, name)
  writeFileSync(filename, source)
  fixtures.push(filename)
  return filename
}

for (const [name, source, , directoryIndex = 0] of probes) {
  fixture(name, source, directories[directoryIndex])
}
fixture(
  'valid.ts',
  'export { Link, createLink, linkOptions } from "@tanstack/react-router"\nexport type { LinkProps, LinkComponent } from "@tanstack/react-router"\nexport type Props = { name: string; onChange: (value: string) => void }\nexport const value = "typed"\nexport const external: unknown = JSON.parse("{}")\nexport function request(): Promise<unknown> { return Promise.resolve({ value: 1 }) }\nPromise.resolve(value).catch(() => { throw new Error("Failed") })',
)
fixture(
  'route-valid.ts',
  'export { useSearch, useParams, useLoaderData, useRouteContext, useNavigate, useRouter, getRouteApi } from "@tanstack/react-router"',
  directories[2],
)
// Flat state variants must not force arbitrary helper extraction.
fixture(
  'variants-valid.ts',
  `export function label(value: ${Array.from({ length: 13 }, (_, i) => `"state${i}"`).join(' | ')}) { switch (value) { ${Array.from({ length: 13 }, (_, i) => `case "state${i}": return "${i}";`).join(' ')} } }`,
)

const outsideHelper = fixture(
  'router.ts',
  'export { useNavigate } from "@tanstack/react-router"',
  directories[5],
)
const architectureFixtures = [
  ['route.ts', 'export { Route } from "@/routes/_examples/index"'],
  ['router.ts', 'export { router } from "@/app/router"'],
  ['generated.ts', 'export { routeTree } from "@/routeTree.gen"'],
].map(([name, source]) => ({
  filename: fixture(name, source, directories[3]),
  rule: 'routing-is-composed-at-the-boundary',
}))
architectureFixtures.push(
  {
    filename: fixture(
      'dynamic-router.ts',
      'export function loadRouting() { return import("@tanstack/react-router") }',
      directories[3],
    ),
    rule: 'no-dynamic-router-imports-outside-routes',
  },
  {
    filename: fixture(
      'router.ts',
      'export { useNavigate } from "@tanstack/react-router"',
      directories[4],
    ),
    rule: 'no-router-in-stock-ui',
  },
  {
    filename: fixture(
      'outside-helper.ts',
      `export { useNavigate } from ${JSON.stringify(relative(directories[3], outsideHelper).replaceAll('\\', '/'))}`,
      directories[3],
    ),
    rule: 'no-app-imports-outside-src',
  },
)
const routeDynamicImport = fixture(
  'dynamic-valid.ts',
  'export function loadRouting() { return import("@tanstack/react-router") }',
  directories[2],
)

function lintBootstrap(main, router) {
  const root = mkdtempSync(resolve('__bootstrap-probe-'))
  directories.push(root)
  for (const path of ['src', 'src/app']) {
    const directory = join(root, path)
    mkdirSync(directory)
    directories.push(directory)
  }
  const config = fixture(
    'oxlint.config.ts',
    readFileSync('oxlint.config.ts', 'utf8'),
    root,
  )
  const filenames = [
    fixture('main.tsx', main, join(root, 'src')),
    fixture('router.tsx', router, join(root, 'src/app')),
  ]
  const result = spawnSync(
    process.execPath,
    [oxlint, '--config', config, '--format', 'json', ...filenames],
    { encoding: 'utf8' },
  )
  return { result, filenames }
}

const invalidBootstrap = lintBootstrap(
  'export { useNavigate, useSearch } from "@tanstack/react-router"',
  'export { useNavigate, useRouter } from "@tanstack/react-router"',
)
const validBootstrap = lintBootstrap(
  'export { RouterProvider } from "@tanstack/react-router"',
  'export { createRouter, Link, createLink, linkOptions } from "@tanstack/react-router"\nexport type { LinkProps, LinkComponent } from "@tanstack/react-router"',
)

// Matching each rule prevents parser/tool failures from passing as enforcement.
const lint = spawnSync(
  process.execPath,
  [
    oxlint,
    '--config',
    'oxlint.config.ts',
    '--format',
    'json',
    ...directories.slice(0, 4),
  ],
  { encoding: 'utf8' },
)
assert.equal(lint.error, undefined)
assert.equal(lint.status, 1, lint.stdout + lint.stderr)
const { diagnostics } = JSON.parse(lint.stdout)

const architecture = spawnSync(
  process.execPath,
  [
    resolve('node_modules/dependency-cruiser/bin/dependency-cruiser.mjs'),
    ...architectureFixtures.map(({ filename }) => filename),
    routeDynamicImport,
    '--config',
    'config/dependency-cruiser.cjs',
    '--output-type',
    'json',
  ],
  { encoding: 'utf8' },
)

for (const [name, , rule] of probes) {
  await test(`Oxlint rejects ${name} through ${rule}`, () => {
    assert.ok(
      diagnostics.some(
        (item) =>
          item.filename.replaceAll('\\', '/').endsWith(`/${name}`) &&
          item.code === rule,
      ),
      `Missing enforcement: ${rule}\n${lint.stdout}\n${lint.stderr}`,
    )
  })
}

await test('typed links, route-boundary imports, and flat exhaustive unions pass', () => {
  assert.deepEqual(
    diagnostics.filter((item) => item.filename.endsWith('valid.ts')),
    [],
  )
})

await test('Router imports cannot bypass the boundary through modules, dynamic imports, or stock UI', () => {
  assert.equal(architecture.error, undefined)
  assert.equal(
    architecture.status,
    0,
    architecture.stdout + architecture.stderr,
  )
  const { summary } = JSON.parse(architecture.stdout)
  for (const { filename, rule } of architectureFixtures) {
    assert.ok(
      summary.violations.some(
        (violation) =>
          resolve(violation.from) === filename && violation.rule.name === rule,
      ),
      `Missing ${rule} for ${filename}\n${architecture.stdout}`,
    )
  }
  assert.deepEqual(
    summary.violations.filter(
      (violation) => resolve(violation.from) === routeDynamicImport,
    ),
    [],
  )
})

await test('bootstrap files allow setup imports but reject Router hooks', () => {
  const { result, filenames } = invalidBootstrap
  assert.equal(result.error, undefined)
  assert.equal(result.status, 1, result.stdout + result.stderr)
  const { diagnostics } = JSON.parse(result.stdout)
  for (const filename of filenames) {
    assert.ok(
      diagnostics.some(
        (item) =>
          resolve(item.filename) === filename &&
          item.code === 'eslint(no-restricted-imports)',
      ),
      `Missing bootstrap restriction for ${filename}\n${result.stdout}`,
    )
  }
  const valid = validBootstrap.result
  assert.equal(valid.error, undefined)
  assert.equal(valid.status, 0, valid.stdout + valid.stderr)
  assert.deepEqual(JSON.parse(valid.stdout).diagnostics, [])
})

await test('only Oxlint is configured as the JavaScript/TypeScript linter', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  assert.equal(pkg.devDependencies.eslint, undefined)
  assert.equal(existsSync('eslint.config.mjs'), false)
  assert.match(
    pkg.scripts.lint,
    /check-source-policy\.mjs && oxlint --config oxlint\.config\.ts/u,
  )
  assert.doesNotMatch(Object.values(pkg.scripts).join('\n'), /\beslint\b/u)
})

await test('CSS rules reject escalating specificity and allow ordinary CSS', async () => {
  const invalid = await stylelint.lint({
    code: '/* stylelint-disable */\n#example { color: red !important; }\n.a { .b { .c { .d { .e { color: red; } } } } }',
    codeFilename: resolve('src/policy-probe.css'),
    configFile: resolve('config/stylelint.config.mjs'),
  })
  const rules = invalid.results.flatMap((result) =>
    result.warnings.map((warning) => warning.rule),
  )
  for (const rule of [
    'declaration-no-important',
    'selector-max-id',
    'max-nesting-depth',
  ]) {
    assert.ok(rules.includes(rule), `Missing CSS protection: ${rule}`)
  }
  const valid = await stylelint.lint({
    code: '.example {\n  display: grid;\n  gap: 1rem;\n}\n',
    codeFilename: resolve('src/policy-probe.css'),
    configFile: resolve('config/stylelint.config.mjs'),
  })
  assert.equal(valid.errored, false)
})

await test('application JavaScript and enums cannot bypass repository policies', () => {
  assert.match(
    findPolicyViolations(
      resolve('src/unchecked.js'),
      'export const value = 1',
    ).join(),
    /must be TypeScript/u,
  )
  assert.match(
    findPolicyViolations(
      resolve('src/value.ts'),
      'export enum Value { A }',
    ).join(),
    /instead of an enum/u,
  )
})

await test('declaration assertions cannot bypass initialization checks', () => {
  for (const source of [
    'export let value!: string;',
    'export class Value { value!: string; }',
  ]) {
    assert.match(
      findPolicyViolations(resolve('src/value.ts'), source).join(),
      /definite-assignment assertions/u,
    )
  }
  assert.deepEqual(
    findPolicyViolations(
      resolve('src/value.ts'),
      'export const value = "ready"; export class Value { readonly value: string; constructor(value: string) { this.value = value; } }',
    ),
    [],
  )
})

await test('routes use folders instead of flat names and ignore colocated support files', () => {
  for (const filename of [
    'about.tsx',
    '_examples.profile.tsx',
    '_examples.profile/route.tsx',
    '_examples/profile.tsx',
    '_examples/schema.ts',
    '_examples/route.test.tsx',
    'nested/__root.tsx',
  ]) {
    assert.match(
      findPolicyViolations(resolve('src/routes', filename), '').join(),
      /directory-based routes/u,
      filename,
    )
  }
  for (const filename of [
    '__root.tsx',
    'index.tsx',
    '_examples/route.tsx',
    '_examples/index.tsx',
    '_examples/profile/route.tsx',
    'projects/$projectId/route.tsx',
    '(authenticated)/projects/route.tsx',
    'version[.]json/route.ts',
    '[.well-known]/route.tsx',
    'about/route.lazy.tsx',
    '_examples/index.lazy.tsx',
    '_examples/-schema.ts',
    '_examples/-examples.test.tsx',
    '_examples/-support/schema.ts',
  ]) {
    assert.deepEqual(
      findPolicyViolations(resolve('src/routes', filename), ''),
      [],
      filename,
    )
  }
})

await test('state tags require separate union members and reject hidden or optional tags', () => {
  for (const source of [
    "type State = { kind: 'A' | 'B' }",
    "type State = { 'kind': ('A' | 'B') }",
    "type State = { ['kind']: 'A' | 'B' }",
    "type Kind = 'A' | 'B'; type State = { kind: Kind }",
    "type State = { kind?: 'A' }",
    'type State = { kind: string }',
  ]) {
    assert.match(
      findPolicyViolations(resolve('src/state.ts'), source).join(),
      /separate union members/u,
    )
  }
  assert.deepEqual(
    findPolicyViolations(
      resolve('src/state.ts'),
      "type State = { kind: 'A'; value: string } | { kind: 'B'; message: string }",
    ),
    [],
  )
})

await test('the Router interface exception allows only its library registration', () => {
  const filename = resolve('src/app/router.tsx')
  const registration =
    'declare module "@tanstack/react-router" { interface Register { router: typeof router } }'
  assert.deepEqual(findPolicyViolations(filename, registration), [])
  for (const source of [
    'interface Props { name: string }',
    'interface Register { name: string }',
    'declare module "other-library" { interface Register { name: string } }',
    registration + '\ninterface Unrelated { name: string }',
  ]) {
    assert.match(
      findPolicyViolations(filename, source).join(),
      /only TanStack Register/u,
    )
  }
})

await test('inline Router type imports cannot bypass named import restrictions', () => {
  for (const filename of [
    'src/features/example/contract.ts',
    'src/main.tsx',
    'src/app/router.tsx',
  ]) {
    for (const source of [
      'type Navigation = import("@tanstack/react-router").NavigateOptions',
      'type Navigation = import("@tanstack/router-core").NavigateOptions',
      'type History = import("@tanstack/history").RouterHistory',
      'type RouterModule = typeof import("@tanstack/react-router")',
    ]) {
      assert.match(
        findPolicyViolations(resolve(filename), source).join(),
        /named Router type imports/u,
      )
    }
  }
  assert.deepEqual(
    findPolicyViolations(
      resolve('src/features/example/link.ts'),
      'import type { LinkProps } from "@tanstack/react-router"',
    ),
    [],
  )
  assert.deepEqual(
    findPolicyViolations(
      resolve('src/routes/-contract.ts'),
      'type Navigation = import("@tanstack/react-router").NavigateOptions',
    ),
    [],
  )
})

for (const directive of [
  '/* oxlint-disable */',
  '// oxlint-disable-next-line typescript/no-explicit-any',
  '/* eslint-disable */',
  '// eslint-disable-next-line no-console',
  '/* oxlint-disable no-warning-comments */',
]) {
  await test(`repository policy rejects ${directive}`, () => {
    const source = `${directive}\nexport const value: any = 1`
    assert.match(
      findPolicyViolations(resolve('src/value.ts'), source).join(),
      /inline lint configuration is forbidden/u,
    )
  })
}

await test('policy parses comments inside blocks and JSX, while allowing strings', () => {
  for (const source of [
    'function value() { /* oxlint-disable */ }',
    'export const node = <div>{/* oxlint-disable */}</div>',
  ]) {
    assert.match(
      findPolicyViolations(resolve('src/value.tsx'), source).join(),
      /inline lint configuration is forbidden/u,
    )
  }
  assert.deepEqual(
    findPolicyViolations(
      resolve('src/value.ts'),
      'export const text = "/* oxlint-disable */"',
    ),
    [],
  )
})

function typeScriptProgram(configFile, sources) {
  const config = ts.getParsedCommandLineOfConfigFile(
    configFile,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) =>
        assert.fail(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        ),
    },
  )
  assert.deepEqual(config.errors, [])
  const host = ts.createCompilerHost(config.options)
  const original = host.getSourceFile.bind(host)
  host.getSourceFile = (
    file,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) => {
    const source = sources.get(resolve(file))
    return source !== undefined
      ? ts.createSourceFile(file, source, languageVersion, true)
      : original(file, languageVersion, onError, shouldCreateNewSourceFile)
  }
  const projectFiles = config.fileNames.filter(
    (file) =>
      !directories.some((directory) =>
        resolve(file).startsWith(directory + sep),
      ),
  )
  return ts.createProgram(
    [...projectFiles, ...sources.keys()],
    config.options,
    host,
  )
}

await test('TypeScript rejects unsafe types and non-erasable syntax', () => {
  const filename = resolve('src/__type_guard_probe__.ts')
  const cases = [
    ['unchecked index', 'export const fromArray: string = ["value"][1];', 2322],
    [
      'optional property',
      'export const optional: { name?: string } = { name: undefined };',
      2375,
    ],
    ['null', 'export const nonNull: string = null;', 2322],
    ['implicit any', 'export function identity(value) { return value; }', 7006],
    [
      'unknown catch',
      'export function caught() { try { throw new Error(); } catch (error) { return error.message; } }',
      18046,
    ],
    [
      'function variance',
      'export const handle: (value: string | number) => void = (value: string) => { value.toUpperCase(); };',
      2322,
    ],
    [
      'iterator completion',
      'export const iteratorValue: string = new Set(["value"]).values().next().value;',
      2322,
    ],
    [
      'call arguments',
      'export const called = ((value: string) => value).call(undefined, 1);',
      2345,
    ],
    [
      'field initialization',
      'export class Uninitialized { value: string; }',
      2564,
    ],
    ['enum', 'export enum RuntimeEnum { Value }', 1294],
    ['const enum', 'export const enum InlinedEnum { Value }', 1294],
    [
      'parameter property',
      'export class ParameterProperty { constructor(readonly value: string) {} }',
      1294,
    ],
    [
      'runtime namespace',
      'export namespace RuntimeNamespace { export const value = 1; }',
      1294,
    ],
  ]
  const scriptFiles = [
    resolve('src/__module_guard_one__.ts'),
    resolve('src/__module_guard_two__.ts'),
  ]
  const sources = new Map([
    [filename, cases.map(([, source]) => source).join('\n')],
    ...scriptFiles.map((file) => [
      file,
      'const sharedName = 1; sharedName.toFixed();',
    ]),
  ])
  const program = typeScriptProgram('config/tsconfig.app.json', sources)
  const diagnostics = ts.getPreEmitDiagnostics(program)
  for (const [line, [name, , code]] of cases.entries()) {
    assert.ok(
      diagnostics.some(
        (item) =>
          item.file &&
          resolve(item.file.fileName) === filename &&
          item.file.getLineAndCharacterOfPosition(item.start).line === line &&
          item.code === code,
      ),
      `Missing TypeScript protection for ${name} (TS${code})`,
    )
  }
  assert.deepEqual(
    diagnostics.filter(
      (item) => item.file && scriptFiles.includes(resolve(item.file.fileName)),
    ),
    [],
    'Files without imports or exports must have independent module scope.',
  )
})

await test('browser types reject Node globals while tools retain them', () => {
  const filename = resolve('src/__environment_guard_probe__.ts')
  const sources = new Map([
    [
      filename,
      [
        'export const scheduled = setImmediate(() => undefined);',
        'export const detached = setTimeout(() => undefined, 0).unref();',
        'export const timer: number = window.setTimeout(() => undefined, 0);',
      ].join('\n'),
    ],
  ])
  for (const [configFile, expectedCodes] of [
    ['config/tsconfig.app.json', [2304, 2339]],
    ['config/tsconfig.tools.json', []],
  ]) {
    const program = typeScriptProgram(configFile, sources)
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .filter((item) => item.file && resolve(item.file.fileName) === filename)
    assert.deepEqual(
      diagnostics.map((item) => item.code),
      expectedCodes,
      configFile,
    )
    if (configFile === 'config/tsconfig.app.json') {
      assert.deepEqual(
        program
          .getSourceFiles()
          .filter((file) =>
            /\/node_modules\/@types\/node\//u.test(
              file.fileName.replaceAll('\\', '/'),
            ),
          ),
        [],
        'Application dependencies must not introduce Node globals transitively.',
      )
    }
  }
})
