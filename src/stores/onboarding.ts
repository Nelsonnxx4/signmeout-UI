import { defineStore } from 'pinia'

export const COMMISSION_POLICY_VERSION = 'mvp-1.0'

const STORAGE_KEY = 'signmeout:onboarding-draft'

interface OnboardingState {
  school: string
  department: string
  schoolComplete: boolean
  bankCode: string
  bankName: string
  accountNumber: string
  accountLast4: string
  accountName: string
  bankComplete: boolean
  commissionAccepted: boolean
  commissionAcceptedAt: string | null
  commissionPolicyVersion: string | null
}

type StoredDraft = Omit<OnboardingState, 'accountNumber'>

const emptyState: OnboardingState = {
  school: '',
  department: '',
  schoolComplete: false,
  bankCode: '',
  bankName: '',
  accountNumber: '',
  accountLast4: '',
  accountName: '',
  bankComplete: false,
  commissionAccepted: false,
  commissionAcceptedAt: null,
  commissionPolicyVersion: null,
}

function readStoredDraft(): Partial<StoredDraft> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return {}

    const parsed: unknown = JSON.parse(stored)
    return parsed && typeof parsed === 'object' ? (parsed as Partial<StoredDraft>) : {}
  } catch {
    return {}
  }
}

export const useOnboardingStore = defineStore('onboarding', {
  state: (): OnboardingState => ({
    ...emptyState,
    ...readStoredDraft(),
    accountNumber: '',
  }),
  getters: {
    nextRoute(state) {
      if (!state.schoolComplete) return '/onboarding/school'
      if (!state.bankComplete) return '/onboarding/bank'
      if (!state.commissionAccepted) return '/onboarding/commission'
      return '/dashboard'
    },
    isComplete: (state) => state.schoolComplete && state.bankComplete && state.commissionAccepted,
  },
  actions: {
    persistDraft() {
      if (typeof window === 'undefined') return

      const safeDraft: StoredDraft = {
        school: this.school,
        department: this.department,
        schoolComplete: this.schoolComplete,
        bankCode: this.bankCode,
        bankName: this.bankName,
        accountLast4: this.accountLast4,
        accountName: this.accountName,
        bankComplete: this.bankComplete,
        commissionAccepted: this.commissionAccepted,
        commissionAcceptedAt: this.commissionAcceptedAt,
        commissionPolicyVersion: this.commissionPolicyVersion,
      }

      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeDraft))
    },
    saveSchool(payload: { school: string; department: string }) {
      this.school = payload.school
      this.department = payload.department
      this.schoolComplete = true
      this.persistDraft()
    },
    saveBank(payload: {
      bankCode: string
      bankName: string
      accountNumber?: string
      accountName: string
    }) {
      this.bankCode = payload.bankCode
      this.bankName = payload.bankName
      this.accountName = payload.accountName

      if (payload.accountNumber) {
        this.accountNumber = payload.accountNumber
        this.accountLast4 = payload.accountNumber.slice(-4)
      }

      this.bankComplete = true
      this.persistDraft()
    },
    acceptCommission() {
      this.commissionAccepted = true
      this.commissionAcceptedAt = new Date().toISOString()
      this.commissionPolicyVersion = COMMISSION_POLICY_VERSION
      this.persistDraft()
    },
    reset() {
      this.$patch({ ...emptyState })
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(STORAGE_KEY)
      }
    },
  },
})
