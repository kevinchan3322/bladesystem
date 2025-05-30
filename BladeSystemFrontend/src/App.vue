<script setup>
import { RouterView } from 'vue-router'
import { initGoogleAuth } from './utils/google-auth'

// Initialize Google OAuth when the app starts
initGoogleAuth().catch(err => {
  console.error('Failed to initialize Google OAuth:', err)
})
</script>

<template>
  <RouterView />
</template>
