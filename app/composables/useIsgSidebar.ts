export const useIsgSidebar = () => {
  const isExpanded = useState('isg_sidebar_expanded', () => true)
  const isMobileOpen = useState('isg_sidebar_mobile_open', () => false)

  const restoreState = () => {
    if (!import.meta.client) return
    const saved = window.localStorage.getItem('isg_sidebar_expanded')
    if (saved !== null) isExpanded.value = saved !== 'false'
  }

  const toggle = () => {
    isExpanded.value = !isExpanded.value
    if (import.meta.client) window.localStorage.setItem('isg_sidebar_expanded', String(isExpanded.value))
  }

  const toggleMobile = () => {
    isMobileOpen.value = !isMobileOpen.value
  }

  const closeMobile = () => {
    isMobileOpen.value = false
  }

  if (import.meta.client) restoreState()

  return {
    isExpanded,
    isMobileOpen,
    toggle,
    toggleMobile,
    closeMobile,
  }
}
