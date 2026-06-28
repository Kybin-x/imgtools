<template>
  <AppNav />
  <div class="main-content">
    <RouterView />
  </div>
  <AppToast />
</template>

<script setup>
import { onMounted } from 'vue'
import AppNav from './components/AppNav.vue'
import AppToast from './components/AppToast.vue'
import { useTheme } from './composables/useTheme.js'

// Apply saved theme on mount
const { theme } = useTheme()
onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
})
</script>
