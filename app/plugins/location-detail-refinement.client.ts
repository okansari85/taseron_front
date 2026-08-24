export default defineNuxtPlugin((nuxtApp) => {
  const styleId = 'location-detail-refinement-style'

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .location-detail-refinement > section:first-child > div > div:nth-child(3) .border-l {
        padding-top: 56px !important;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(3) > div:first-child > div:first-child p:nth-child(2) {
        font-size: 12px !important;
        line-height: 1.55 !important;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(3) > div:first-child > div:first-child > div {
        font-size: 11px !important;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(3) > div:first-child > div:first-child > div > div {
        font-size: 11px !important;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(3) .absolute.right-4 {
        top: 14px !important;
      }

      .location-detail-refinement + * {
        margin-top: 16px !important;
      }

      .location-detail-refinement .mb-4.flex.items-center.justify-end {
        justify-content: flex-start !important;
      }

      .location-detail-refinement .mb-4.flex.items-center.justify-end > button {
        margin-left: auto;
      }
    `
    document.head.appendChild(style)
  }

  const apply = () => {
    const root = document.querySelector('.font-outfit.mx-auto.w-full')
    if (!root) return

    const isLocationDetail = useRoute().path.includes('/locations/')
    root.classList.toggle('location-detail-refinement', isLocationDetail)
  }

  nuxtApp.hook('page:finish', apply)
  nuxtApp.hook('app:mounted', apply)
})
