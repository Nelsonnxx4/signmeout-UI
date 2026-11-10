<script setup lang="ts">
import PasswordlessAuthForm from '@/components/auth/PasswordlessAuthForm.vue'
</script>

<template>
  <PasswordlessAuthForm
    intent="signup"
    eyebrow="Create your shirt owner account"
    title="Start with your email"
    description="We’ll email you a one-time code to create your SignMeOut account. No password needed."
    submit-label="Email me a sign-up link"
    sent-title="Check your inbox"
    sent-description="We sent a one-time sign-in code to "
    alternate-text="Already have an account?"
    alternate-label="Sign in"
    alternate-to="/login"
  />
</template>
