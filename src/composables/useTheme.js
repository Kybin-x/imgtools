import { ref } from 'vue'

const theme = ref(localStorage.getItem('img-theme') || 'dark')

function apply(t) {
  document.documentElement.setAttribute('data-theme', t)
}

apply(theme.value)

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('img-theme', theme.value)
    apply(theme.value)
  }
  return { theme, toggle }
}
