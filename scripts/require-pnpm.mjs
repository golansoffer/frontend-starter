if (!process.env.npm_config_user_agent?.startsWith('pnpm/')) {
  throw new Error(
    'Use pnpm install. This repository has one package manager and one lockfile.',
  )
}
