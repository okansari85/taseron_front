export default defineNuxtPlugin(() => {
  const applyWideLayout = () => {
    if (!window.location.pathname.endsWith('/fire-suppression/reports/upload')) return

    const styleId = 'fire-suppression-upload-wide-layout'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @media (min-width: 1280px) {
        .fire-suppression-upload-wide-shell {
          max-width: 1400px !important;
          width: min(1400px, calc(100vw - 64px)) !important;
        }
      }
    `
    document.head.appendChild(style)

    const shell = document.querySelector('.mx-auto.max-w-3xl')
    if (shell) shell.classList.add('fire-suppression-upload-wide-shell')
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyWideLayout, { once: true })
  } else {
    applyWideLayout()
  }
})
