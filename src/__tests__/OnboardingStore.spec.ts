import { beforeEach, describe, expect, it } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'

import { COMMISSION_POLICY_VERSION, useOnboardingStore } from '@/stores/onboarding'

describe('onboarding store', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('tracks the complete owner setup without persisting the full account number', () => {
    const onboarding = useOnboardingStore()

    onboarding.saveSchool({
      school: 'University of Lagos',
      department: 'Computer Science',
    })
    onboarding.saveBank({
      bankCode: '058',
      bankName: 'Guaranty Trust Bank',
      accountNumber: '0123456789',
      accountName: 'Nelson Orhembetyoga',
    })
    onboarding.acceptCommission()

    expect(onboarding.isComplete).toBe(true)
    expect(onboarding.accountLast4).toBe('6789')
    expect(onboarding.commissionPolicyVersion).toBe(COMMISSION_POLICY_VERSION)
    expect(onboarding.commissionAcceptedAt).toBeTruthy()

    const persistedDraft = window.sessionStorage.getItem('signmeout:onboarding-draft') ?? ''
    expect(persistedDraft).not.toContain('0123456789')
    expect(persistedDraft).toContain('6789')
  })

  it('restores safe progress after a refresh', () => {
    const onboarding = useOnboardingStore()

    onboarding.saveSchool({ school: 'University of Ibadan', department: 'Economics' })
    onboarding.saveBank({
      bankCode: '044',
      bankName: 'Access Bank',
      accountNumber: '1234567890',
      accountName: 'Nelson Orhembetyoga',
    })

    setActivePinia(createPinia())
    const restored = useOnboardingStore()

    expect(restored.school).toBe('University of Ibadan')
    expect(restored.bankName).toBe('Access Bank')
    expect(restored.accountNumber).toBe('')
    expect(restored.accountLast4).toBe('7890')
    expect(restored.nextRoute).toBe('/onboarding/commission')
  })
})
