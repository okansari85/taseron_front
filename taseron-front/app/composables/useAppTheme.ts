import { useTheme } from 'vuetify'

export function useAppTheme() {
  const theme = useTheme()

  const isDark = computed(() => theme.global.current.value.dark)

  function setTheme(name: 'taseronLight' | 'taseronDark') {
    theme.global.name.value = name
    if (import.meta.client) {
      localStorage.setItem('taseron-theme', name)
    }
  }

  function toggle() {
    setTheme(isDark.value ? 'taseronLight' : 'taseronDark')
  }

  return { isDark, toggle, setTheme }
}
