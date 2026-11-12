import { defineStore } from 'pinia'

import { apiRequest } from '@/lib/api'

export const COMMISSION_POLICY_VERSION = '2026-11-08-15pct-v1'

const STORAGE_KEY = 'signmeout:onboarding-draft'

interface OnboardingState {
  school: string
  department: string
  schoolComplete: boolean
  studentFullName: string
  admissionNumber: string
  nickname: string
  studentDetailsComplete: boolean
  bankCode: string
  bankName: string
  accountNumber: string
  accountLast4: string
  accountName: string
  bankComplete: boolean
  commissionAccepted: boolean
  commissionAcceptedAt: string | null
  commissionPolicyVersion: string | null
  statusSynced: boolean
}

type StoredDraft = Omit<
  OnboardingState,
  | 'accountNumber'
  | 'studentFullName'
  | 'admissionNumber'
  | 'nickname'
  | 'studentDetailsComplete'
  | 'statusSynced'
>

interface OnboardingApiStatus {
  completed: boolean
  profile: {
    school: { id: string; name: string }
    department: { id: string; name: string }
  } | null
  studentVerification: {
    status: string
    fullName: string | null
    admissionNumber: string | null
    nickname: string | null
  } | null
  bank: { bankName: string; accountName: string; accountNumber: string } | null
  commission: {
    policy: { version: string }
    acceptedAt: string | null
  }
}

const emptyState: OnboardingState = {
  school: '',
  department: '',
  schoolComplete: false,
  studentFullName: '',
  admissionNumber: '',
  nickname: '',
  studentDetailsComplete: false,
  bankCode: '',
  bankName: '',
  accountNumber: '',
  accountLast4: '',
  accountName: '',
  bankComplete: false,
  commissionAccepted: false,
  commissionAcceptedAt: null,
  commissionPolicyVersion: null,
  statusSynced: false,
}

function readStoredDraft(): Partial<StoredDraft> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return {}

    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') return {}

    const draft = parsed as Partial<StoredDraft>
    if (draft.commissionPolicyVersion !== COMMISSION_POLICY_VERSION) {
      return {
        ...draft,
        commissionAccepted: false,
        commissionAcceptedAt: null,
        commissionPolicyVersion: null,
      }
    }

    return draft
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
      if (!state.studentDetailsComplete) return '/onboarding/student'
      if (!state.bankComplete) return '/onboarding/bank'
      if (!state.commissionAccepted) return '/onboarding/commission'
      return '/dashboard'
    },
    isComplete: (state) =>
      state.schoolComplete &&
      state.studentDetailsComplete &&
      state.bankComplete &&
      state.commissionAccepted,
  },
  actions: {
    async syncFromApi(force = false) {
      if (this.statusSynced && !force) return

      const status = await apiRequest<OnboardingApiStatus>('/onboarding/status')
      this.school = status.profile?.school.name ?? ''
      this.department = status.profile?.department.name ?? ''
      this.schoolComplete = Boolean(status.profile)
      this.studentFullName = status.studentVerification?.fullName ?? ''
      this.admissionNumber = status.studentVerification?.admissionNumber ?? ''
      this.nickname = status.studentVerification?.nickname ?? ''
      this.studentDetailsComplete = status.studentVerification?.status === 'APPROVED'
      this.bankName = status.bank?.bankName ?? ''
      this.accountName = status.bank?.accountName ?? ''
      this.accountLast4 = status.bank?.accountNumber.slice(-4) ?? ''
      this.bankComplete = Boolean(status.bank)
      this.commissionAccepted = Boolean(status.commission.acceptedAt)
      this.commissionAcceptedAt = status.commission.acceptedAt
      this.commissionPolicyVersion = status.commission.policy.version
      this.statusSynced = true
    },
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
    saveStudentDetails(payload: { fullName: string; admissionNumber: string; nickname?: string }) {
      this.studentFullName = payload.fullName
      this.admissionNumber = payload.admissionNumber
      this.nickname = payload.nickname ?? ''
      this.studentDetailsComplete = true
      this.statusSynced = true
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
      this.statusSynced = true
      this.persistDraft()
    },
    acceptCommission(policyVersion = COMMISSION_POLICY_VERSION) {
      this.commissionAccepted = true
      this.commissionAcceptedAt = new Date().toISOString()
      this.commissionPolicyVersion = policyVersion
      this.statusSynced = true
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
