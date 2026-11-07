import { test, expect } from '@playwright/test'

test('redirects the root route to passwordless signup', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/signup$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Start with your email')
})

test('validates an email and shows the passwordless confirmation', async ({ page }) => {
  await page.goto('/signup')

  await page.getByLabel('Email address').fill('not-an-email')
  await page.getByRole('button', { name: 'Email me a sign-up link' }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter a valid email address.')

  await page.getByLabel('Email address').fill('owner@signmeout.ng')
  await page.getByRole('button', { name: 'Email me a sign-up link' }).click()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your inbox')
  await expect(page.getByText('owner@signmeout.ng')).toBeVisible()
})

test('completes the owner onboarding steps', async ({ page }) => {
  await page.goto('/onboarding/school')

  await page.getByLabel('School').selectOption('University of Lagos')
  await page.getByLabel('Department').selectOption('Computer Science')
  await page.getByRole('button', { name: 'Continue to bank account' }).click()

  await expect(page).toHaveURL(/\/onboarding\/bank$/)
  await page.getByLabel('Bank').selectOption('058')
  await page.getByLabel('Account number').fill('0123456789')
  await page.getByLabel('Account holder name').fill('Nelson Orhembetyoga')
  await page.getByRole('button', { name: 'Review commission' }).click()

  await expect(page).toHaveURL(/\/onboarding\/commission$/)
  await page.getByLabel('I accept the 10% platform commission.').check()
  await page.getByRole('button', { name: 'Finish setup' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText('Create your first virtual shirt')).toBeVisible()
})

test('creates and publishes a fixed short-sleeve shirt', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'signmeout:onboarding-draft',
      JSON.stringify({
        school: 'University of Lagos',
        department: 'Computer Science',
        schoolComplete: true,
        bankCode: '058',
        bankName: 'Guaranty Trust Bank',
        accountLast4: '6789',
        accountName: 'Nelson Orhembetyoga',
        bankComplete: true,
        commissionAccepted: true,
        commissionAcceptedAt: new Date().toISOString(),
        commissionPolicyVersion: 'mvp-1.0',
      }),
    )
  })

  await page.goto('/shirts/new')
  await page.getByRole('radio', { name: /Short-sleeve T-shirt/ }).check()
  await page.getByRole('button', { name: 'Create draft' }).click()

  await expect(page).toHaveURL(/\/shirts\/.+\/edit$/)
  await expect(page.getByRole('heading', { name: 'Short-sleeve T-shirt' })).toBeVisible()
  await page.getByRole('link', { name: 'Preview shirt' }).click()

  await expect(page).toHaveURL(/\/shirts\/.+\/preview$/)
  await page.getByRole('button', { name: 'Publish shirt' }).click()
  await expect(page.getByRole('link', { name: 'View public shirt' })).toBeVisible()
  await expect(page.getByLabel('Public shirt link')).toHaveValue(/\/s\/shirt/)
})
