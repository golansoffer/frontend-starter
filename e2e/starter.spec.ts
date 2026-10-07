import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('loads data and validates the form with the keyboard', async ({
  page,
}) => {
  const consoleMessages: { type: string; text: string }[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() })
  })
  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })

  await page.goto('/profile')
  await expect(
    page.getByRole('heading', { name: 'Profile form', level: 1 }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Validate profile' }).click()
  await expect(
    page.getByRole('textbox', { name: 'Display name' }),
  ).toHaveAccessibleDescription('Use at least 2 characters.')
  await page.getByRole('textbox', { name: 'Display name' }).fill('  Ada  ')
  await page.getByRole('textbox', { name: 'Email' }).fill('ada@example.com')
  await page.getByRole('textbox', { name: 'Email' }).press('Enter')
  await expect(page.getByRole('status')).toHaveText(
    'Validated profile for Ada. Nothing was sent or saved.',
  )
  await expect(page).toHaveURL('/profile')
  expect(
    consoleMessages.filter((message) =>
      ['warning', 'error'].includes(message.type),
    ),
  ).toEqual([])
  expect(pageErrors).toEqual([])
})

test('supports typed navigation, direct links, and refresh', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'About', exact: true }).click()
  await expect(page).toHaveURL('/about')
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'About this starter' }),
  ).toBeVisible()
  const homeLink = page.getByRole('link', { name: 'Back to home' })
  await expect(homeLink).toHaveAttribute('href', '/')
  const opened = page.context().waitForEvent('page')
  await homeLink.click({ modifiers: ['ControlOrMeta'] })
  const newTab = await opened
  await expect(newTab).toHaveURL('/')
  await expect(page).toHaveURL('/about')
  await newTab.close()
  await homeLink.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Your next project' }),
  ).toBeVisible()
})

test('renders an unknown URL with a way home', async ({ page }) => {
  await page.goto('/does-not-exist')
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Back to home' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your next project' }),
  ).toBeVisible()
})

test('rejects malformed server data and allows recovery', async ({ page }) => {
  await page.route('**/example-project.json', async (route) => {
    await route.fulfill({ json: { name: 123 } })
  })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Something went wrong' }),
  ).toBeVisible()
  await page.unroute('**/example-project.json')
  await page.getByRole('button', { name: 'Reload page' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your next project' }),
  ).toBeVisible()
})

test('handles HTTP failures', async ({ page }) => {
  await page.route('**/example-project.json', async (route) => {
    await route.fulfill({ status: 404, body: 'Missing' })
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText(
    'We could not load this page.',
  )
})

test('has no detected accessibility violations before or after validation', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Your next project' }),
  ).toBeVisible()
  const scan = () =>
    new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
  expect((await scan()).violations).toEqual([])
  await page.getByRole('link', { name: 'Profile form' }).click()
  await expect(page.getByRole('form', { name: 'Profile' })).toBeVisible()
  expect((await scan()).violations).toEqual([])
  await page.getByRole('button', { name: 'Validate profile' }).click()
  await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  expect((await scan()).violations).toEqual([])
  await page.evaluate(async () => {
    document.documentElement.classList.add('dark')
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished),
    )
  })
  expect((await scan()).violations).toEqual([])
})

test('keeps the starter usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/profile')
  await expect(
    page.getByRole('button', { name: 'Validate profile' }),
  ).toBeVisible()
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(overflows).toBe(false)
})

test('restores URL-owned views on reload, Back, and Forward without saving private drafts', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Project data' })).toBeVisible()
  await page.getByRole('link', { name: 'Profile form' }).click()
  await expect(page).toHaveURL('/profile')
  await page.getByRole('textbox', { name: 'Email' }).fill('private@example.com')
  await expect(page).toHaveURL('/profile')
  await page.reload()
  await expect(page.getByRole('form', { name: 'Profile' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('')
  await page.goBack()
  await expect(page.getByRole('region', { name: 'Project data' })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('form', { name: 'Profile' })).toBeVisible()
  await page.getByRole('link', { name: 'Project data' }).click()
  await expect(page).toHaveURL('/')
})

test('loads the profile route independently of the project API', async ({
  page,
}) => {
  const projectRequests: string[] = []
  await page.route('**/example-project.json', async (route) => {
    projectRequests.push(route.request().url())
    await route.fulfill({ status: 503, body: 'Unavailable' })
  })
  await page.goto('/profile')
  await expect(page.getByRole('form', { name: 'Profile' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Profile form' }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page).toHaveURL('/profile')
  expect(projectRequests).toEqual([])
})

test('exposes landmarks and supports native keyboard navigation with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await page.getByRole('link', { name: 'Profile form' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('form', { name: 'Profile' })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Profile form' }),
  ).toBeVisible()
})
