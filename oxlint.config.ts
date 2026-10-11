import { defineConfig } from 'oxlint'

const restrictedImports = {
  patterns: [
    {
      regex:
        '^(node:|@radix-ui/|(?:radix-ui|react-router|react-router-dom|react-hook-form)(?:/|$))',
      message:
        'Use the browser APIs and the established Base UI / TanStack stack.',
    },
  ],
  paths: [
    {
      name: 'react',
      importNames: [
        'useEffect',
        'useLayoutEffect',
        'useInsertionEffect',
        'default',
      ],
      message:
        'Effects require a specific external synchronization use case and a file-scoped exception. Use named React imports. See AGENTS.md.',
    },
  ],
}

const linkImports = [
  'Link',
  'createLink',
  'linkOptions',
  'LinkProps',
  'LinkComponent',
]

function restrictRouterImports(allowImportNames: string[]) {
  return {
    patterns: [
      ...restrictedImports.patterns,
      {
        group: [
          '@tanstack/react-router/*',
          '@tanstack/router-core',
          '@tanstack/router-core/*',
          '@tanstack/history',
          '@tanstack/history/*',
        ],
        message:
          'Router internals belong at the route boundary. Pass values and named callbacks instead.',
      },
    ],
    paths: [
      ...restrictedImports.paths,
      {
        name: '@tanstack/react-router',
        allowImportNames,
        message:
          'Read Router state and define route-dependent behavior in src/routes. Elsewhere, use only the permitted link or setup APIs.',
      },
    ],
  }
}

export default defineConfig({
  options: {
    typeAware: true,
    denyWarnings: true,
    reportUnusedDisableDirectives: 'error',
    respectEslintDisableDirectives: false,
  },
  plugins: ['typescript', 'react', 'jsx-a11y', 'import', 'unicorn', 'oxc'],
  categories: {
    correctness: 'error',
  },
  env: {
    builtin: true,
  },
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    '.tools/**',
    '.tanstack/**',
    '.husky/**',
    'src/routeTree.gen.ts',
    'src/components/ui/**',
  ],
  settings: {
    'jsx-a11y': {
      components: {
        Link: 'a',
        Input: 'input',
        Button: 'button',
      },
      attributes: {
        href: ['href', 'to'],
      },
    },
  },
  rules: {
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'no-var': 'error',
    'prefer-const': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-debugger': 'error',
    'unicorn/no-abusive-eslint-disable': 'error',
    'unicorn/no-useless-promise-resolve-reject': 'error',
    'import/first': 'error',
    'import/no-duplicates': 'error',
    'sort-imports': [
      'error',
      {
        ignoreDeclarationSort: true,
      },
    ],
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-autofocus': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',
    'react/rules-of-hooks': 'error',
    'react/exhaustive-deps': 'error',
    'react/no-array-index-key': 'error',
    'react/no-unstable-nested-components': 'error',
    'react/no-danger': 'error',
    'react/no-unknown-property': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/unsupported-syntax': 'error',
    'react/prefer-function-component': 'error',
    'react/no-deriving-state-in-effects': 'error',
    'react/set-state-in-effect': 'error',
    'react/set-state-in-render': 'error',
    'react/forbid-dom-props': [
      'error',
      {
        forbid: ['style'],
      },
    ],
    'jsx-a11y/prefer-tag-over-role': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/no-noninteractive-tabindex': 'error',
    'oxc/no-accumulating-spread': 'error',
    'oxc/no-map-spread': 'error',
  },
  overrides: [
    {
      files: ['**/*.{js,mjs,cjs}'],
      env: {
        node: true,
      },
    },
    {
      files: ['**/*.{ts,tsx,mts,cts}'],
      env: {
        browser: true,
      },
      rules: {
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'typescript/await-thenable': 'error',
        'typescript/ban-ts-comment': [
          'error',
          {
            'ts-ignore': true,
            'ts-nocheck': true,
            'ts-check': false,
            'ts-expect-error': true,
          },
        ],
        'typescript/no-array-delete': 'error',
        'typescript/no-base-to-string': 'error',
        'typescript/no-confusing-void-expression': 'error',
        'typescript/no-deprecated': 'error',
        'typescript/no-duplicate-type-constituents': 'error',
        'typescript/no-dynamic-delete': 'error',
        'typescript/no-empty-object-type': 'error',
        'typescript/no-explicit-any': 'error',
        'typescript/no-extraneous-class': 'error',
        'typescript/no-floating-promises': [
          'error',
          {
            ignoreVoid: false,
            checkThenables: true,
          },
        ],
        'typescript/no-for-in-array': 'error',
        'typescript/no-generated-empty-object-type': 'error',
        'typescript/no-implied-eval': 'error',
        'typescript/no-invalid-void-type': 'error',
        'typescript/no-meaningless-void-operator': 'error',
        'typescript/no-misused-new': 'error',
        'typescript/no-misused-promises': 'error',
        'typescript/no-misused-spread': 'error',
        'typescript/method-signature-style': ['error', 'property'],
        'typescript/no-namespace': 'error',
        'typescript/no-non-null-assertion': 'error',
        'typescript/no-redundant-type-constituents': 'error',
        'typescript/no-require-imports': 'error',
        'typescript/no-this-alias': 'error',
        'typescript/no-unnecessary-boolean-literal-compare': 'error',
        'typescript/no-unnecessary-condition': 'error',
        'typescript/no-unnecessary-template-expression': 'error',
        'typescript/no-unnecessary-type-arguments': 'error',
        'typescript/no-unnecessary-type-assertion': 'error',
        'typescript/no-unnecessary-type-constraint': 'error',
        'typescript/no-unnecessary-type-conversion': 'error',
        'typescript/no-unnecessary-type-parameters': 'error',
        'typescript/no-unsafe-argument': 'error',
        'typescript/no-unsafe-assignment': 'error',
        'typescript/no-unsafe-call': 'error',
        'typescript/no-unsafe-declaration-merging': 'error',
        'typescript/no-unsafe-enum-comparison': 'error',
        'typescript/no-unsafe-function-type': 'error',
        'typescript/no-unsafe-member-access': 'error',
        'typescript/no-unsafe-return': 'error',
        'typescript/no-unsafe-unary-minus': 'error',
        'typescript/no-useless-default-assignment': 'error',
        'typescript/no-wrapper-object-types': 'error',
        'typescript/only-throw-error': 'error',
        'typescript/prefer-as-const': 'error',
        'typescript/prefer-namespace-keyword': 'error',
        'typescript/prefer-promise-reject-errors': 'error',
        'typescript/prefer-reduce-type-parameter': 'error',
        'typescript/prefer-return-this-type': 'error',
        'typescript/related-getter-setter-pairs': 'error',
        'typescript/require-await': 'error',
        'typescript/restrict-plus-operands': [
          'error',
          {
            allowAny: false,
            allowBoolean: false,
            allowNullish: false,
            allowNumberAndString: false,
            allowRegExp: false,
          },
        ],
        'typescript/restrict-template-expressions': [
          'error',
          {
            allowAny: false,
            allowBoolean: false,
            allowNever: false,
            allowNullish: false,
            allowNumber: false,
            allowRegExp: false,
          },
        ],
        'typescript/return-await': ['error', 'error-handling-correctness-only'],
        'typescript/triple-slash-reference': 'error',
        'typescript/unbound-method': 'error',
        'typescript/unified-signatures': 'error',
        'typescript/use-unknown-in-catch-callback-variable': 'error',
        'typescript/adjacent-overload-signatures': 'error',
        'typescript/array-type': 'error',
        'typescript/ban-tslint-comment': 'error',
        'typescript/class-literal-property-style': 'error',
        'typescript/consistent-generic-constructors': 'error',
        'typescript/consistent-indexed-object-style': 'error',
        'typescript/consistent-type-assertions': [
          'error',
          {
            assertionStyle: 'never',
          },
        ],
        'typescript/consistent-type-definitions': ['error', 'type'],
        'typescript/dot-notation': 'error',
        'typescript/no-inferrable-types': 'error',
        'typescript/prefer-find': 'error',
        'typescript/prefer-for-of': 'error',
        'typescript/prefer-function-type': 'error',
        'typescript/prefer-includes': 'error',
        'typescript/prefer-nullish-coalescing': 'error',
        'typescript/prefer-optional-chain': 'error',
        'typescript/prefer-regexp-exec': 'error',
        'typescript/prefer-string-starts-ends-with': 'error',
        'no-array-constructor': 'error',
        'no-unused-expressions': 'error',
        'no-useless-constructor': 'error',
        'no-empty-function': 'error',
        'no-undef': 'off',
        'typescript/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
            fixStyle: 'separate-type-imports',
          },
        ],
        'typescript/consistent-type-exports': 'error',
        'typescript/strict-boolean-expressions': [
          'error',
          {
            allowString: false,
            allowNumber: false,
          },
        ],
        'typescript/switch-exhaustiveness-check': 'error',
        'typescript/no-import-type-side-effects': 'error',
        complexity: [
          'error',
          {
            max: 12,
            variant: 'modified',
          },
        ],
        'max-depth': ['error', 3],
        'no-console': 'error',
      },
    },
    {
      files: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**/*.{ts,tsx}',
        'e2e/**/*.ts',
        '*.config.ts',
        'config/**/*.ts',
      ],
      env: {
        node: true,
      },
    },
    {
      files: ['src/**/*.{ts,tsx}'],
      jsPlugins: [
        '@tanstack/eslint-plugin-query',
        '@tanstack/eslint-plugin-router',
      ],
      rules: {
        '@tanstack/query/exhaustive-deps': 'error',
        '@tanstack/query/no-rest-destructuring': 'error',
        '@tanstack/query/stable-query-client': 'error',
        '@tanstack/query/no-unstable-deps': 'error',
        '@tanstack/query/infinite-query-property-order': 'error',
        '@tanstack/query/mutation-property-order': 'error',
        '@tanstack/router/create-route-property-order': 'error',
        '@tanstack/router/route-param-names': 'error',
        'no-restricted-imports': ['error', restrictedImports],
        'no-restricted-globals': [
          'error',
          {
            name: 'process',
            message: 'Use the validated public env module.',
          },
          {
            name: 'Buffer',
            message: 'Node APIs are unavailable in the browser.',
          },
          {
            name: 'URLSearchParams',
            message:
              'Use TanStack Router and a Zod schema for application URL state. A non-routing HTTP serializer needs a scoped exception.',
          },
        ],
        'no-restricted-properties': [
          'error',
          {
            object: 'history',
            property: 'pushState',
            message: 'Use TanStack Router for navigation.',
          },
          {
            object: 'history',
            property: 'replaceState',
            message: 'Use TanStack Router for navigation.',
          },
          {
            object: 'window',
            property: 'history',
            message: 'Use TanStack Router for navigation and history.',
          },
          {
            object: 'location',
            property: 'search',
            message: 'Read validated search state through TanStack Router.',
          },
        ],
      },
    },
    {
      files: ['src/**/*.tsx'],
      rules: {
        'react/only-export-components': [
          'error',
          {
            allowConstantExport: true,
            allowExportNames: ['Route'],
          },
        ],
      },
    },
    {
      files: ['src/app/router.tsx', 'src/routes/**/*.tsx', 'src/**/*.test.tsx'],
      rules: {
        'react/only-export-components': 'off',
      },
    },
    {
      files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': 'off',
        'no-restricted-globals': 'off',
      },
    },
    {
      files: ['src/**/*.test.{ts,tsx}'],
      plugins: [
        'typescript',
        'react',
        'jsx-a11y',
        'import',
        'unicorn',
        'oxc',
        'vitest',
      ],
      jsPlugins: ['eslint-plugin-testing-library'],
      rules: {
        'testing-library/await-async-events': [
          'error',
          {
            eventModule: 'userEvent',
          },
        ],
        'testing-library/await-async-queries': 'error',
        'testing-library/await-async-utils': 'error',
        'testing-library/no-await-sync-events': [
          'error',
          {
            eventModules: ['fire-event'],
          },
        ],
        'testing-library/no-await-sync-queries': 'error',
        'testing-library/no-container': 'error',
        'testing-library/no-debugging-utils': 'error',
        'testing-library/no-dom-import': ['error', 'react'],
        'testing-library/no-global-regexp-flag-in-query': 'error',
        'testing-library/no-manual-cleanup': 'error',
        'testing-library/no-node-access': 'error',
        'testing-library/no-promise-in-fire-event': 'error',
        'testing-library/no-render-in-lifecycle': 'error',
        'testing-library/no-unnecessary-act': 'error',
        'testing-library/no-wait-for-multiple-assertions': 'error',
        'testing-library/no-wait-for-side-effects': 'error',
        'testing-library/no-wait-for-snapshot': 'error',
        'testing-library/prefer-find-by': 'error',
        'testing-library/prefer-presence-queries': 'error',
        'testing-library/prefer-query-by-disappearance': 'error',
        'testing-library/prefer-screen-queries': 'error',
        'testing-library/render-result-naming-convention': 'error',
        'vitest/no-focused-tests': 'error',
        'vitest/no-disabled-tests': 'error',
      },
    },
    {
      files: ['e2e/**/*.ts'],
      jsPlugins: ['eslint-plugin-playwright'],
      rules: {
        'no-empty-pattern': 'off',
        'playwright/consistent-spacing-between-blocks': 'error',
        'playwright/expect-expect': 'error',
        'playwright/max-nested-describe': 'error',
        'playwright/missing-playwright-await': 'error',
        'playwright/no-conditional-expect': 'error',
        'playwright/no-conditional-in-test': 'error',
        'playwright/no-duplicate-hooks': 'error',
        'playwright/no-duplicate-slow': 'error',
        'playwright/no-element-handle': 'error',
        'playwright/no-eval': 'error',
        'playwright/no-focused-test': 'error',
        'playwright/no-force-option': 'error',
        'playwright/no-identical-title': 'error',
        'playwright/no-nested-step': 'error',
        'playwright/no-networkidle': 'error',
        'playwright/no-page-pause': 'error',
        'playwright/no-skipped-test': 'error',
        'playwright/no-standalone-expect': 'error',
        'playwright/no-unnecessary-assertions': 'error',
        'playwright/no-unsafe-references': 'error',
        'playwright/no-unused-locators': 'error',
        'playwright/no-useless-await': 'error',
        'playwright/no-useless-not': 'error',
        'playwright/no-wait-for-navigation': 'error',
        'playwright/no-wait-for-selector': 'error',
        'playwright/no-wait-for-timeout': 'error',
        'playwright/prefer-hooks-in-order': 'error',
        'playwright/prefer-hooks-on-top': 'error',
        'playwright/prefer-locator': 'error',
        'playwright/prefer-to-have-count': 'error',
        'playwright/prefer-to-have-length': 'error',
        'playwright/prefer-web-first-assertions': 'error',
        'playwright/valid-describe-callback': 'error',
        'playwright/valid-expect': 'error',
        'playwright/valid-expect-in-promise': 'error',
        'playwright/valid-test-tags': 'error',
        'playwright/valid-title': 'error',
      },
    },
    {
      files: ['src/**/*.{ts,tsx}'],
      excludeFiles: ['src/routes/**', 'src/app/router.tsx', 'src/main.tsx'],
      rules: {
        'no-restricted-imports': ['error', restrictRouterImports(linkImports)],
      },
    },
    {
      files: ['src/main.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          restrictRouterImports(['RouterProvider']),
        ],
      },
    },
    {
      files: [
        'src/features/export-example/sample-request.ts',
        'src/features/tasks/tasks-api.ts',
        'src/features/conversations/conversation-api.ts',
      ],
      // Fake requests preserve async return/rejection semantics without real I/O.
      rules: { 'typescript/require-await': 'off' },
    },
    {
      files: ['src/app/router.tsx'],
      // Type aliases cannot merge TanStack's Register. Source policy permits only that declaration.
      rules: {
        'typescript/consistent-type-definitions': 'off',
        'no-restricted-imports': [
          'error',
          restrictRouterImports([...linkImports, 'createRouter']),
        ],
      },
    },
  ],
})
