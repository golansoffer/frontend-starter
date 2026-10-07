const routerPackages = '(^|/)@tanstack/(react-router|router-core|history)(/|$)'

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-app-imports-outside-src',
      severity: 'error',
      from: { path: '^src/' },
      to: { dependencyTypes: ['local'], pathNot: '^src/' },
    },
    {
      name: 'no-router-in-stock-ui',
      severity: 'error',
      from: { path: '^src/components/ui/' },
      to: { path: routerPackages },
    },
    {
      name: 'no-dynamic-router-imports-outside-routes',
      severity: 'error',
      from: { path: '^src/', pathNot: '^src/routes/' },
      to: { path: routerPackages, dependencyTypes: ['dynamic-import'] },
    },
    {
      name: 'no-node-builtins-in-browser-code',
      severity: 'error',
      from: { path: '^src/', pathNot: '(\\.test\\.[^.]+$|^src/test/)' },
      to: { dependencyTypes: ['core'] },
    },
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'no-unresolved-imports',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-undeclared-packages',
      severity: 'error',
      from: {},
      to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
    },
    {
      name: 'no-test-code-in-production',
      severity: 'error',
      from: { path: '^src/', pathNot: '(\\.test\\.[^.]+$|^src/test/)' },
      to: { path: '(\\.test\\.[^.]+$|^src/test/)' },
    },
    {
      name: 'no-dev-dependencies-in-production',
      severity: 'error',
      from: { path: '^src/', pathNot: '(\\.test\\.[^.]+$|^src/test/)' },
      to: { dependencyTypes: ['npm-dev'], dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'lib-does-not-import-ui-or-features',
      severity: 'error',
      from: { path: '^src/lib/' },
      to: { path: '^src/(app|routes|features|components)/' },
    },
    {
      name: 'shared-ui-does-not-import-features',
      severity: 'error',
      from: { path: '^src/components/' },
      to: { path: '^src/(app|routes|features)/' },
    },
    {
      name: 'features-do-not-import-app-or-routes',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { path: '^src/(app|routes)/' },
    },
    {
      name: 'routing-is-composed-at-the-boundary',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot:
          '^src/(routes/|app/router\\.tsx$|main\\.tsx$|routeTree\\.gen\\.ts$)',
      },
      to: {
        path: '^src/(routes/|app/router\\.tsx$|main\\.tsx$|routeTree\\.gen\\.ts$)',
      },
    },
    {
      name: 'features-stay-independent',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/', pathNot: '^src/features/$1/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      conditionNames: ['import', 'browser', 'default'],
    },
  },
}
