export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  let observer: MutationObserver | null = null
  let timer: number | null = null

  const setupFindingCards = () => {
    if (!location.pathname.endsWith('/fire-suppression/reports/upload')) return

    const heading = Array.from(document.querySelectorAll('p')).find((el) =>
      el.textContent?.trim().toLocaleLowerCase('tr-TR') === 'uygunsuzluklar (opsiyonel)'.toLocaleLowerCase('tr-TR'),
    )
    const section = heading?.parentElement?.parentElement
    if (!section) return

    const textareas = section.querySelectorAll('textarea[placeholder="Açıklama"]')
    textareas.forEach((textarea) => {
      const card = textarea.closest('div.mb-3') as HTMLElement | null
      if (!card || card.dataset.findingCollapseReady === '1') return

      const header = card.firstElementChild as HTMLElement | null
      if (!header) return

      card.dataset.findingCollapseReady = '1'
      let expanded = false

      const toggleButton = document.createElement('button')
      toggleButton.type = 'button'
      toggleButton.className = 'mr-auto ml-2 inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300'

      const setExpanded = (value: boolean) => {
        expanded = value
        Array.from(card.children).slice(1).forEach((child) => {
          ;(child as HTMLElement).style.display = expanded ? '' : 'none'
        })
        toggleButton.textContent = expanded ? 'Detayı Kapat' : 'Detayı Aç'
      }

      toggleButton.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        setExpanded(!expanded)
      })

      const title = header.querySelector('span')
      if (title) {
        title.insertAdjacentElement('afterend', toggleButton)
      } else {
        header.insertBefore(toggleButton, header.firstChild)
      }

      setExpanded(false)
    })
  }

  const scheduleSetup = () => {
    if (timer !== null) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = null
      setupFindingCards()
    }, 50)
  }

  const start = () => {
    setupFindingCards()
    observer?.disconnect()
    observer = new MutationObserver(scheduleSetup)
    observer.observe(document.body, { childList: true, subtree: true })
  }

  const stop = () => {
    observer?.disconnect()
    observer = null
    if (timer !== null) window.clearTimeout(timer)
    timer = null
  }

  const router = useRouter()
  router.afterEach(() => {
    stop()
    window.setTimeout(start, 0)
  })

  start()
})
