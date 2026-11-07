import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { useOnboardingStore } from '@/stores/onboarding'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'signup' },
  },
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'signup',
        name: 'signup',
        component: () => import('@/views/auth/SignupView.vue'),
        meta: { title: 'Create account' },
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { title: 'Sign in' },
      },
      {
        path: 'recover-account',
        name: 'recover-account',
        component: () => import('@/views/auth/RecoverAccountView.vue'),
        meta: { title: 'Recover account' },
      },
    ],
  },
  {
    path: '/onboarding',
    component: () => import('@/layouts/OnboardingLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'onboarding-school' },
      },
      {
        path: 'school',
        name: 'onboarding-school',
        component: () => import('@/views/onboarding/SchoolDetailsView.vue'),
        meta: { title: 'School and department', onboardingStep: 1 },
      },
      {
        path: 'bank',
        name: 'onboarding-bank',
        component: () => import('@/views/onboarding/BankDetailsView.vue'),
        meta: { title: 'Bank account', onboardingStep: 2 },
      },
      {
        path: 'commission',
        name: 'onboarding-commission',
        component: () => import('@/views/onboarding/CommissionView.vue'),
        meta: { title: 'Platform commission', onboardingStep: 3 },
      },
    ],
  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: 'Dashboard' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'signup' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes,
})

router.beforeEach((to) => {
  const onboardingStep =
    typeof to.meta.onboardingStep === 'number' ? to.meta.onboardingStep : undefined

  if (!onboardingStep && !to.meta.requiresOnboarding) return true

  const onboarding = useOnboardingStore()

  if (onboardingStep && onboardingStep >= 2 && !onboarding.schoolComplete) {
    return { name: 'onboarding-school' }
  }

  if (onboardingStep && onboardingStep >= 3 && !onboarding.bankComplete) {
    return { name: 'onboarding-bank' }
  }

  if (to.meta.requiresOnboarding && !onboarding.isComplete) {
    return onboarding.nextRoute
  }

  return true
})

router.afterEach((to) => {
  const pageTitle = typeof to.meta.title === 'string' ? to.meta.title : undefined
  document.title = pageTitle ? `${pageTitle} · SignMeOut` : 'SignMeOut'
})

export default router
