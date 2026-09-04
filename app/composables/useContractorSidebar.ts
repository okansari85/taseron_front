export const useContractorSidebar = () => {
  const isExpanded = useState('contractor_sidebar_expanded', () => true)
  const isMobileOpen = useState('contractor_sidebar_mobile_open', () => false)

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
