export default defineNuxtPlugin(() => {
  const styleId = 'location-logo-sizing'

  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    table td:nth-child(3) span.h-13.w-13 {
      width: 44px !important;
      height: 44px !important;
      padding: 8px !important;
    }

    table td:nth-child(3) span.h-13.w-13 img {
      max-width: 30px !important;
      max-height: 26px !important;
      width: auto !important;
      height: auto !important;
    }

    table td:nth-child(3) > div {
      gap: 4px !important;
    }
  `

  document.head.appendChild(style)
})
