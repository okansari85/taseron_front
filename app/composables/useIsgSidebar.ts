export const useIsgSidebar = () => {
  const isExpanded = useState('isg_sidebar_expanded', () => true)
  const isMobileOpen = useState('isg_sidebar_mobile_open', () => false)

  const toggle = () => {
    isExpanded.value = !isExpanded.value
  }

  const toggleMobile = () => {
    isMobileOpen.value = !isMobileOpen.value
  }

  const closeMobile = () => {
    isMobileOpen.value = false
  }

  return {
    isExpanded,
    isMobileOpen,
    toggle,
    toggleMobile,
    closeMobile,
  }
}
