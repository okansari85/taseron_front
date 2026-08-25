export default defineNuxtPlugin((nuxtApp) => {
  const styleId = 'location-detail-refinement-style'

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:last-child {
        border-left: 1px solid rgb(229 231 235) !important;
        padding-left: 20px !important;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:first-child {
        padding-right: 24px !important;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(2) > .absolute.right-4 {
        right: 308px !important;
        top: 14px !important;
        z-index: 20 !important;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:last-child {
        position: relative;
        z-index: 1;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:first-child {
        position: relative;
        z-index: 2;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:first-child .mt-7 {
        margin-top: 28px !important;
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
