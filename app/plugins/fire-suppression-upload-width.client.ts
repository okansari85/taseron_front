export default defineNuxtPlugin(() => {
  const applyWideLayout = () => {
    if (!window.location.pathname.endsWith('/fire-suppression/reports/upload')) return

    const shells = document.querySelectorAll('.mx-auto.max-w-3xl')
    shells.forEach((shell) => {
      const element = shell as HTMLElement
      element.classList.add('fire-suppression-upload-wide-shell')
      element.style.maxWidth = '1400px'
      element.style.width = 'min(1400px, calc(100vw - 64px))'
    })
  }

  applyWideLayout()

  const observer = new MutationObserver(() => applyWideLayout())
  observer.observe(document.body, { childList: true, subtree: true })

  const styleId = 'fire-suppression-upload-wide-layout'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @media (min-width: 1280px) {
        .fire-suppression-upload-wide-shell {
          max-width: 1400px !important;
          width: min(1400px, calc(100vw - 64px)) !important;
        }
      }
      @media (max-width: 1279px) {
        .fire-suppression-upload-wide-shell {
          width: calc(100vw - 32px) !important;
          max-width: none !important;
        }
      }
    `
    document.head.appendChild(style)
  }
})
