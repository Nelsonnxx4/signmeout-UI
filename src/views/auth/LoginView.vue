<script setup lang="ts">
import PasswordlessAuthForm from '@/components/auth/PasswordlessAuthForm.vue'
</script>

<template>
  <PasswordlessAuthForm
    intent="login"
    eyebrow="Welcome back"
    title="Sign in to SignMeOut"
    description="Enter your account email and we’ll send you a one-time sign-in code."
    submit-label="Email me a sign-in link"
    sent-title="Check your inbox"
    sent-description="We sent a one-time sign-in code to "
    alternate-text="New to SignMeOut?"
    alternate-label="Create an account"
    alternate-to="/signup"
    recovery-to="/recover-account"
  />
</template>
