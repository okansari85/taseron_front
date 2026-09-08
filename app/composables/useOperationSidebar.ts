export const useOperationSidebar = () => {
  const isExpanded = useState('operation_sidebar_expanded', () => true)
  const isMobileOpen = useState('operation_sidebar_mobile_open', () => false)

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
