<script setup lang="ts">
import PasswordlessAuthForm from '@/components/auth/PasswordlessAuthForm.vue'
</script>

<template>
  <PasswordlessAuthForm
    intent="recovery"
    eyebrow="Account recovery"
    title="Get back into your account"
    description="There’s no password to reset. Enter your account email and we’ll send a one-time sign-in code."
    submit-label="Email me a sign-in code"
    sent-title="Check your inbox"
    sent-description="If an account exists for this address, a one-time code is on its way to "
    alternate-text="Remember your account email?"
    alternate-label="Back to sign in"
    alternate-to="/login"
  />
</template>
