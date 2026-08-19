export function useTailAdminTheme() {
  const isDark = useState('tailadmin-dark', () => false)

  const apply = (dark: boolean) => {
    isDark.value = dark
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
      localStorage.setItem('taseron-theme', dark ? 'dark' : 'light')
    }
  }

  const toggle = () => apply(!isDark.value)

  if (import.meta.client) {
    onMounted(() => {
      const saved = localStorage.getItem('taseron-theme')
      apply(saved === 'dark')
    })
  }

  return { isDark, toggle, apply }
}
