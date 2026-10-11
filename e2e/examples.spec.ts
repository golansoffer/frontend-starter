import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import {
  messageLimit,
  titleLimit,
} from '../src/features/conversations/conversation-schema'

function recordBrowserErrors(page: Page) {
  const messages: string[] = []
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) {
      messages.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    messages.push(error.message)
  })
  return messages
}

async function checkPageTitle(page: Page, title: string) {
  await expect(page).toHaveTitle(title)
  await expect(page.locator('head title')).toHaveCount(1)
}

async function checkAccessibility(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
}

test('prepares a sample with the keyboard and renders terminal success', async ({
  page,
}) => {
  const browserErrors = recordBrowserErrors(page)
  await page.goto('/async-button')
  await expect(
    page.getByRole('heading', { name: '1. Controlled async button' }),
  ).toBeVisible()
  await checkPageTitle(page, '1. Controlled async button')
  await checkAccessibility(page)
  await page.getByRole('button', { name: 'Prepare sample' }).press('Enter')
  await expect(page.getByRole('status')).toHaveText('sample.csv: 3 rows ready.')
  await expect(
    page.getByRole('button', { name: 'Sample ready' }),
  ).toBeDisabled()
  await checkAccessibility(page)
  expect(browserErrors).toEqual([])
})

test('keeps task search drafts private and restores committed views through browser history', async ({
  page,
}) => {
  const browserErrors = recordBrowserErrors(page)
  await page.goto('/tasks')
  await expect(
    page.getByRole('heading', { name: '2. URL-owned task list' }),
  ).toBeVisible()
  const search = page.getByRole('searchbox', { name: 'Search tasks' })
  await checkPageTitle(page, '2. URL-owned task list')
  const results = page
    .getByRole('region', { name: 'Results' })
    .getByRole('listitem')
  await search.fill('private draft')
  await expect(page).toHaveURL('/tasks')
  await page.getByRole('radio', { name: 'Completed (2)', exact: true }).check()
  await expect(page).toHaveURL('/tasks?filter=completed')
  await expect(search).toHaveValue('private draft')
  await expect(results).toHaveText([
    'Document API changesCompleted',
    'Update dependenciesCompleted',
  ])
  await page.getByRole('radio', { name: 'Z to A' }).check()
  await expect(page).toHaveURL('/tasks?filter=completed&sort=title-desc')
  await expect(results).toHaveText([
    'Update dependenciesCompleted',
    'Document API changesCompleted',
  ])
  await search.fill('  dependencies  ')
  await search.press('Enter')
  await expect(page).toHaveURL(
    '/tasks?search=dependencies&filter=completed&sort=title-desc',
  )
  await expect(search).toHaveValue('dependencies')
  await expect(search).toBeFocused()
  await expect(results).toHaveText(['Update dependenciesCompleted'])

  await page.goBack()
  await expect(page).toHaveURL('/tasks?filter=completed&sort=title-desc')
  await expect(search).toHaveValue('')
  await expect(results).toHaveCount(2)
  await page.goBack()
  await expect(page.getByRole('radio', { name: 'A to Z' })).toBeChecked()
  await page.goForward()
  await expect(page.getByRole('radio', { name: 'Z to A' })).toBeChecked()
  await page.reload()
  await expect(
    page.getByRole('radio', { name: 'Completed (2)', exact: true }),
  ).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Z to A' })).toBeChecked()
  await expect(search).toHaveValue('')
  await checkPageTitle(page, '2. URL-owned task list')
  await checkAccessibility(page)
  expect(browserErrors).toEqual([])
})

test('creates a conversation through its route and resets private drafts when its identity changes', async ({
  page,
}) => {
  const browserErrors = recordBrowserErrors(page)
  await page.goto('/conversations')
  await expect(page).toHaveURL('/conversations/new')
  await expect(
    page.getByRole('heading', { name: '3. New conversation' }),
  ).toBeVisible()
  await checkPageTitle(page, '3. New conversation')
  await page
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill('Architecture notes')
  await expect(page).toHaveURL('/conversations/new')
  await checkAccessibility(page)
  await page.getByRole('button', { name: 'Create conversation' }).click()
  await expect(page).toHaveURL('/conversations/conversation-2')
  await expect(
    page.getByRole('heading', { name: 'Architecture notes', level: 1 }),
  ).toBeVisible()
  await checkPageTitle(page, 'Architecture notes')
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  const messages = page.getByRole('list', { name: 'Messages' })
  await message.fill('Keep one owner for each fact.')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(messages).toContainText('Keep one owner for each fact.')
  await expect(message).toHaveValue('')
  await message.fill('A private draft')
  await expect(page).toHaveURL('/conversations/conversation-2')
  await page.getByRole('link', { name: 'Example conversation' }).click()
  await expect(page).toHaveURL('/conversations/conversation-1')
  await expect(
    page.getByRole('heading', { name: 'Frontend craft', level: 1 }),
  ).toBeVisible()
  await checkPageTitle(page, 'Frontend craft')
  await expect(messages.getByRole('listitem')).toHaveText([
    'A conversation keeps related messages together.',
    'Send a message to try the form and mutation flow.',
  ])
  await expect(message).toHaveValue('')
  await checkAccessibility(page)
  await page.goBack()
  await expect(page).toHaveURL('/conversations/conversation-2')
  await checkPageTitle(page, 'Architecture notes')
  await expect(messages).toContainText('Keep one owner for each fact.')
  await expect(message).toHaveValue('')
  await page
    .getByRole('link', { name: 'New conversation', exact: true })
    .click()
  await expect(
    page.getByRole('textbox', { name: 'Title', exact: true }),
  ).toHaveValue('')
  await checkPageTitle(page, '3. New conversation')
  expect(browserErrors).toEqual([])
})

test('rejects an invalid conversation identity before showing its controls', async ({
  page,
}) => {
  await page.goto('/conversations/invalid-id')
  await expect(
    page.getByRole('heading', { name: 'Something went wrong' }),
  ).toBeVisible()
  await checkPageTitle(page, 'Something went wrong')
  await expect(
    page.getByRole('textbox', { name: 'Message', exact: true }),
  ).toHaveCount(0)
  await checkAccessibility(page)
})

test('shows a missing resource after demo data resets on reload', async ({
  page,
}) => {
  const browserErrors = recordBrowserErrors(page)
  await page.goto('/conversations/new')
  await page
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill('Temporary conversation')
  await page.getByRole('button', { name: 'Create conversation' }).click()
  await expect(page).toHaveURL('/conversations/conversation-2')
  await checkPageTitle(page, 'Temporary conversation')
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible()
  await checkPageTitle(page, 'Page not found')
  await expect(page.getByRole('button', { name: 'Reload page' })).toHaveCount(0)
  await expect(
    page.getByRole('textbox', { name: 'Message', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Back to home' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your next project' }),
  ).toBeVisible()
  expect(browserErrors).toEqual([])
})

test('keeps the message composer focused between keyboard submissions', async ({
  page,
}) => {
  const browserErrors = recordBrowserErrors(page)
  await page.goto('/conversations/conversation-1')
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  const messages = page.getByRole('list', { name: 'Messages' })
  await message.fill('First keyboard message')
  await message.press('Enter')
  await expect(messages).toContainText('First keyboard message')
  await expect(message).toHaveValue('')
  await expect(message).toBeFocused()
  await page.keyboard.type('Second keyboard message')
  await page.keyboard.press('Enter')
  await expect(messages).toContainText('Second keyboard message')
  await expect(message).toHaveValue('')
  await expect(message).toBeFocused()
  expect(browserErrors).toEqual([])
})

test('wraps valid maximum-length conversation content on a narrow screen', async ({
  page,
}) => {
  const browserErrors = recordBrowserErrors(page)
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/conversations/new')
  const title = 'W'.repeat(titleLimit)
  const text = 'W'.repeat(messageLimit)
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill(title)
  await page.getByRole('button', { name: 'Create conversation' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: title }),
  ).toBeVisible()
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  await message.fill(text)
  await message.press('Enter')
  await expect(page.getByRole('list', { name: 'Messages' })).toHaveText(text)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
  await checkAccessibility(page)
  expect(browserErrors).toEqual([])
})
