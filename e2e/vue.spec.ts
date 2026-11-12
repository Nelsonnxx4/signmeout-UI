import { expect, test, type Page, type Route } from '@playwright/test'

const policyVersion = '2026-11-08-15pct-v1'
const user = {
  id: 'owner-1',
  name: 'Owner',
  email: 'owner@signmeout.ng',
  emailVerified: true,
  role: 'OWNER',
  createdAt: '2026-11-01T00:00:00.000Z',
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function mockGuestApi(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    if (path === '/auth/get-session') return fulfillJson(route, null)
    if (path === '/auth/email-otp/send-verification-otp') return fulfillJson(route, {})
    return fulfillJson(route, { success: false, error: { message: 'Not mocked' } }, 404)
  })
}

async function mockAuthenticatedApi(page: Page, completed = false) {
  let profile: unknown = completed
    ? {
        school: { id: 'school-1', name: 'University of Lagos' },
        department: { id: 'department-1', name: 'Computer Science' },
      }
    : null
  let studentVerification: unknown = completed
    ? {
        status: 'APPROVED',
        fullName: 'Nelson Orhembetyoga',
        admissionNumber: 'SCI/2026/0148',
        nickname: null,
      }
    : null
  let bank: unknown = completed
    ? {
        bankName: 'GTBank',
        accountName: 'Nelson Orhembetyoga',
        accountNumber: '******6789',
      }
    : null
  let commissionAcceptedAt: string | null = completed ? '2026-11-10T00:00:00.000Z' : null
  const shirts: Array<Record<string, unknown>> = []

  const onboardingStatus = () => ({
    completed: Boolean(profile && studentVerification && bank && commissionAcceptedAt),
    profile,
    studentVerification,
    bank,
    commission: {
      policy: { version: policyVersion },
      acceptedAt: commissionAcceptedAt,
    },
  })

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    const method = request.method()
    const body = request.postData() ? request.postDataJSON() : null

    if (path === '/auth/get-session') {
      return fulfillJson(route, {
        session: { id: 'session-1', expiresAt: '2026-12-01T00:00:00.000Z' },
        user,
      })
    }

    let data: unknown = null
    if (path === '/me') data = user
    else if (path === '/onboarding/status') data = onboardingStatus()
    else if (path === '/schools') data = [{ id: 'school-1', name: 'University of Lagos' }]
    else if (path === '/schools/school-1/departments') {
      data = [{ id: 'department-1', name: 'Computer Science' }]
    } else if (path === '/onboarding/profile' && method === 'PATCH') {
      profile = {
        school: { id: 'school-1', name: 'University of Lagos' },
        department: { id: 'department-1', name: 'Computer Science' },
      }
      data = onboardingStatus()
    } else if (path === '/onboarding/student-verification' && method === 'POST') {
      studentVerification = {
        status: 'APPROVED',
        fullName: body.fullName,
        admissionNumber: body.admissionNumber,
        nickname: body.nickname ?? null,
      }
      data = onboardingStatus()
    } else if (path === '/banks') data = [{ code: '058', name: 'GTBank' }]
    else if (path === '/banks/resolve') data = { accountName: 'Nelson Orhembetyoga' }
    else if (path === '/onboarding/bank' && method === 'POST') {
      bank = {
        bankName: 'GTBank',
        accountName: 'Nelson Orhembetyoga',
        accountNumber: '******6789',
      }
      data = onboardingStatus()
    } else if (path === '/onboarding/commission' && method === 'POST') {
      commissionAcceptedAt = '2026-11-10T00:00:00.000Z'
      data = onboardingStatus()
    } else if (path === '/dashboard/summary') {
      data = {
        successfulContributionCount: 0,
        grossContributionsKobo: 0,
        totalOwnerEarningsKobo: 0,
        signatureCount: 0,
        wallet: { availableBalance: 0 },
        recentTransactions: [],
        recentSignatures: [],
      }
    } else if (path === '/wallet/balance') {
      data = {
        onboardingComplete: true,
        hasValidBank: true,
        totalEarned: 0,
        pendingHolds: 0,
        totalWithdrawn: 0,
        availableBalance: 0,
        lastWithdrawalStatus: null,
      }
    } else if (path === '/wallet/transactions') data = { entries: [], nextCursor: null }
    else if (path === '/shirts' && method === 'POST') {
      const now = new Date().toISOString()
      const shirt = {
        id: 'shirt-1',
        shirtType: body.shirtType,
        slug: 'owner-short-shirt',
        status: 'PAUSED',
        createdAt: now,
        updatedAt: now,
        modelVersion: { version: 1, modelKey: 'short-sleeve.glb' },
        shareUrl: 'http://localhost:5173/s/owner-short-shirt',
      }
      shirts.push(shirt)
      data = shirt
    } else if (path === '/shirts/shirt-1' && method === 'PATCH') {
      const shirt = shirts[0]!
      shirt.status = body.status
      shirt.updatedAt = new Date().toISOString()
      data = shirt
    } else if (path === '/shirts') data = shirts
    else return fulfillJson(route, { success: false, error: { message: 'Not mocked' } }, 404)

    return fulfillJson(route, { success: true, data })
  })
}

test('redirects the root route to passwordless signup', async ({ page }) => {
  await mockGuestApi(page)
  await page.goto('/')

  await expect(page).toHaveURL(/\/signup$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Start with your email')
})

test('validates an email and shows the passwordless confirmation', async ({ page }) => {
  await mockGuestApi(page)
  await page.goto('/signup')

  const submit = page.getByRole('button', { name: 'Email me a verification code' })
  await page.getByLabel('Email address').fill('not-an-email')
  await submit.click()
  await expect(page.getByRole('alert')).toHaveText('Enter a valid email address.')

  await page.getByLabel('Email address').fill('owner@signmeout.ng')
  await submit.click()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your inbox')
  await expect(page.getByText('owner@signmeout.ng')).toBeVisible()
})

test('completes the four owner onboarding steps', async ({ page }) => {
  await mockAuthenticatedApi(page)
  await page.goto('/onboarding/school')

  await page.getByLabel('School').selectOption({ label: 'University of Lagos' })
  await page.getByLabel('Department').selectOption({ label: 'Computer Science' })
  await page.getByRole('button', { name: 'Continue to student details' }).click()

  await expect(page).toHaveURL(/\/onboarding\/student$/)
  await page.getByLabel('Full name').fill('Nelson Orhembetyoga')
  await page.getByLabel('Admission number').fill('SCI/2026/0148')
  await page.getByRole('button', { name: 'Continue to bank account' }).click()

  await expect(page).toHaveURL(/\/onboarding\/bank$/)
  await page.getByLabel('Bank').selectOption('058')
  await page.getByLabel('Account number').fill('0123456789')
  await page.getByLabel('Account holder name').fill('Nelson Orhembetyoga')
  await page.getByRole('button', { name: 'Review commission' }).click()

  await expect(page).toHaveURL(/\/onboarding\/commission$/)
  await page.getByLabel('I accept the 15% platform commission.').check()
  await page.getByRole('button', { name: 'Finish setup' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText('Create your first virtual shirt')).toBeVisible()
})

test('creates and publishes a fixed short-sleeve shirt', async ({ page }) => {
  await mockAuthenticatedApi(page, true)
  await page.goto('/shirts/new')
  await page.getByRole('radio', { name: /Short-sleeve T-shirt/ }).check()
  await page.getByRole('button', { name: 'Create draft' }).click()

  await expect(page).toHaveURL(/\/shirts\/.+\/edit$/)
  await expect(page.getByRole('heading', { name: 'Short-sleeve T-shirt' })).toBeVisible()
  await page.getByRole('link', { name: 'Preview shirt' }).click()

  await expect(page).toHaveURL(/\/shirts\/.+\/preview$/)
  await page.getByRole('button', { name: 'Publish shirt' }).click()
  await expect(page.getByRole('link', { name: 'View public shirt' })).toBeVisible()
  await expect(page.getByLabel('Public shirt link')).toHaveValue(/\/s\/owner-short-shirt$/)
})
