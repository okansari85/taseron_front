import { useTheme } from 'vuetify'

export function useAppTheme() {
  const theme = useTheme()

  const isDark = computed(() => theme.global.current.value.dark)

  function setTheme(name: 'taseronLight' | 'taseronDark', persist = true) {
    theme.global.name.value = name

    if (persist && import.meta.client) {
      localStorage.setItem('taseron-theme', name)
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      const saved = localStorage.getItem('taseron-theme')
      if (saved === 'taseronLight' || saved === 'taseronDark') {
        setTheme(saved, false)
      }
    })
  }

  function toggle() {
    setTheme(isDark.value ? 'taseronLight' : 'taseronDark')
  }

  return { isDark, toggle, setTheme }
}
