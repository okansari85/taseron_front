export default defineNuxtPlugin((nuxtApp) => {
  const styleId = 'location-detail-refinement-style'

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      /* Keep the vertical separator between details and map. */
      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:last-child {
        border-left: 1px solid rgb(229 231 235) !important;
        padding-left: 20px !important;
        position: relative;
        z-index: 1;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:first-child {
        padding-right: 24px !important;
        position: relative;
        z-index: 2;
        padding-top: 0 !important;
      }

      /* Actions remain on the map side, aligned above it, without overlapping the map. */
      .location-detail-refinement > section:first-child > div > div:nth-child(2) > .absolute.right-4 {
        right: 14px !important;
        top: 14px !important;
        z-index: 20 !important;
      }

      /* Leave room for the action row inside the map column. */
      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:last-child {
        padding-top: 56px !important;
      }

      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:last-child > div:first-child {
        margin-top: 0 !important;
      }

      /* Title/status start on the same top line as the image. */
      .location-detail-refinement > section:first-child > div > div:nth-child(2) > div.grid > div:first-child > div:first-child {
        margin-top: 0 !important;
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
