import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { useOnboardingStore } from '@/stores/onboarding'
import { useShirtsStore } from '@/stores/shirts'

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
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true, requiresOnboarding: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'shirts',
        name: 'shirts',
        component: () => import('@/views/shirts/ShirtsView.vue'),
        meta: { title: 'Shirts' },
      },
      {
        path: 'shirts/new',
        name: 'shirt-new',
        component: () => import('@/views/shirts/NewShirtView.vue'),
        meta: { title: 'Create shirt' },
      },
      {
        path: 'shirts/:shirtId/edit',
        name: 'shirt-edit',
        component: () => import('@/views/shirts/ShirtEditorView.vue'),
        meta: { title: 'Shirt editor', requiresShirt: true },
      },
      {
        path: 'shirts/:shirtId/preview',
        name: 'shirt-preview',
        component: () => import('@/views/shirts/ShirtPreviewView.vue'),
        meta: { title: 'Shirt preview', requiresShirt: true },
      },
    ],
  },
  {
    path: '/s/:slug',
    name: 'public-shirt',
    component: () => import('@/views/public/PublicShirtView.vue'),
    meta: { title: 'Virtual shirt' },
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

  if (!onboardingStep && !to.meta.requiresOnboarding && !to.meta.requiresShirt) return true

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

  if (to.meta.requiresShirt) {
    const shirtId = Array.isArray(to.params.shirtId) ? to.params.shirtId[0] : to.params.shirtId
    const shirts = useShirtsStore()

    if (!shirtId || !shirts.getById(shirtId)) {
      return { name: 'shirts' }
    }
  }

  return true
})

router.afterEach((to) => {
  const pageTitle = typeof to.meta.title === 'string' ? to.meta.title : undefined
  document.title = pageTitle ? `${pageTitle} · SignMeOut` : 'SignMeOut'
})

export default router
