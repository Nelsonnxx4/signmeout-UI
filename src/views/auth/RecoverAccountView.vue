<script setup lang="ts">
import PasswordlessAuthForm from '@/components/auth/PasswordlessAuthForm.vue'
</script>

<template>
  <PasswordlessAuthForm
    intent="recovery"
    eyebrow="Account recovery"
    title="Get back into your account"
    description="There’s no password to reset. Enter your account email and we’ll send a secure recovery link."
    submit-label="Email me a recovery link"
    sent-title="Recovery link requested"
    sent-description="If an account exists for this address, a secure recovery link is on its way to "
    alternate-text="Remember your account email?"
    alternate-label="Back to sign in"
    alternate-to="/login"
  />
</template>
