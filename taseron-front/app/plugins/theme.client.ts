export default defineNuxtPlugin(() => {
  const { setTheme } = useAppTheme()
  const saved = localStorage.getItem('taseron-theme')
  if (saved === 'taseronLight' || saved === 'taseronDark') {
    setTheme(saved)
  }
})
