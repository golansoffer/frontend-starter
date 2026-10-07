import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)

await test('every locked braces copy has the audited local patch', () => {
  const lock = readFileSync(
    new URL('../pnpm-lock.yaml', import.meta.url),
    'utf8',
  )
  const snapshots = lock.split(/^snapshots:\s*$/m)[1]
  assert.ok(snapshots, 'Expected pnpm lockfile snapshots')
  const entries = snapshots.match(/^ {2}braces@[^\n]+:/gm)
  assert.ok(entries?.length)
  for (const entry of entries) {
    assert.match(entry, /^ {2}braces@3\.0\.3\(patch_hash=[a-f0-9]+\):$/)
  }
})

// Resolve each consumer's actual dependency chain, not a separate test dependency.
for (const consumer of ['shadcn', 'stylelint']) {
  const fromConsumer = createRequire(require.resolve(consumer))
  const fromGlob = createRequire(fromConsumer.resolve('fast-glob'))
  const fromMicromatch = createRequire(fromGlob.resolve('micromatch'))
  const braces = fromMicromatch('braces')

  await test(`${consumer}: ordinary file patterns still work`, () => {
    assert.equal(braces.compile('src/{a,b}.tsx'), 'src/(a|b).tsx')
    assert.deepEqual(braces.expand('src/{a,b}/{1..2}.tsx'), [
      'src/a/1.tsx',
      'src/a/2.tsx',
      'src/b/1.tsx',
      'src/b/2.tsx',
    ])
    assert.equal(
      braces.stringify(braces.parse('src/{a,b}.tsx')),
      'src/{a,b}.tsx',
    )
  })

  for (const method of ['parse', 'compile', 'expand', 'stringify']) {
    await test(`${consumer}: ${method} rejects deeply nested text`, () => {
      // Stay below the library's existing 10,000-character limit.
      const pattern = '{'.repeat(4_000) + 'a' + '}'.repeat(4_000)
      assert.throws(() => braces[method](pattern), {
        name: 'SyntaxError',
        message: 'Brace nesting exceeds the safety limit of 128',
      })
    })
  }

  for (const method of ['compile', 'expand', 'stringify']) {
    await test(`${consumer}: ${method} guards direct AST input`, () => {
      let ast = { type: 'text', value: 'a' }
      for (let depth = 0; depth < 1_000; depth += 1) {
        ast = { type: 'brace', nodes: [ast] }
      }
      assert.throws(() => braces[method](ast), {
        name: 'SyntaxError',
        message: 'Brace nesting exceeds the safety limit of 128',
      })
    })
  }
}
