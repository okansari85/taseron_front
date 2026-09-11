import { defineStore } from 'pinia'
import { locationApi } from '~/api/location'

export const useIsgDesktopContextStore = defineStore('isgDesktopContext', () => {
  const locationId = ref<number | null>(null)
  const locationName = ref('')
  const locationCity = ref('')
  const locationDistrict = ref('')
  const locationImage = ref('')
  const branchCount = ref(0)

  const branchId = ref<number | null>(null)
  const branchName = ref('')
  const branchCode = ref('')
  const branchLogo = ref('')
  const branchIsActive = ref(true)

  // Tek şubeli (müstakil) bir lokasyonda "Şube Seç" adımının hiç gösterilmemesi gerekir.
  const isStandaloneLocation = computed(() => branchCount.value <= 1)

  // Seçim SADECE bellekte tutuluyordu — sayfa yenilenince (F5) Pinia state'i
  // sıfırlanıp kullanıcı her seferinde Lokasyon/Şube Seç ekranına düşüyordu.
  // workspaceContext.ts'deki aynı desen: tenant başına localStorage'a yazılır
  // (bkz. o dosyadaki not) — sadece per-viewer bir kolaylık, sunucu tarafını
  // etkilemez, sadece restore() sırasında hangi seçimle başlanacağına karar
  // vermek için okunur ve HER ZAMAN backend'den doğrulanır (silinmiş/erişimi
  // kalkmış bir lokasyon/şube sessizce göz ardı edilir).
  const config = useRuntimeConfig()
  const apiBaseUrl = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
  const resolveImageUrl = (image?: string | null) => {
    if (!image) return ''
    if (/^https?:\/\//i.test(image)) return image
    return `${apiBaseUrl}/storage/${String(image).replace(/^\/+/, '').replace(/^storage\//, '')}`
  }

  const storageKey = (tenantId: string | number) => `isg-desktop-context:${tenantId}`
  type PersistedSelection = { locationId: number; branchId: number | null }
  const readPersisted = (tenantId: string | number): PersistedSelection | null => {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(storageKey(tenantId))
      return raw ? (JSON.parse(raw) as PersistedSelection) : null
    } catch {
      return null
    }
  }
  const persist = (tenantId?: string | number | null) => {
    if (!import.meta.client || !tenantId || locationId.value === null) return
    try {
      const payload: PersistedSelection = { locationId: locationId.value, branchId: branchId.value }
      localStorage.setItem(storageKey(tenantId), JSON.stringify(payload))
    } catch {
      // localStorage kullanılamıyorsa (gizli sekme vb.) sessizce yoksay.
    }
  }
  const clearPersisted = (tenantId?: string | number | null) => {
    if (!import.meta.client || !tenantId) return
    try {
      localStorage.removeItem(storageKey(tenantId))
    } catch {
      // yoksay
    }
  }

  const setLocation = (params: { id: number; name: string; city?: string | null; district?: string | null; image?: string | null; branchCount: number }, tenantId?: string | number | null) => {
    locationId.value = params.id
    locationName.value = params.name
    locationCity.value = params.city ?? ''
    locationDistrict.value = params.district ?? ''
    locationImage.value = params.image ?? ''
    branchCount.value = params.branchCount
    branchId.value = null
    branchName.value = ''
    branchCode.value = ''
    branchLogo.value = ''
    branchIsActive.value = true
    persist(tenantId)
  }

  const setBranch = (params: { id: number; name: string; code?: string | null; logo?: string | null; isActive?: boolean }, tenantId?: string | number | null) => {
    branchId.value = params.id
    branchName.value = params.name
    branchCode.value = params.code ?? ''
    branchLogo.value = params.logo ?? ''
    branchIsActive.value = params.isActive ?? true
    persist(tenantId)
  }

  const reset = (tenantId?: string | number | null) => {
    locationId.value = null
    locationName.value = ''
    locationCity.value = ''
    locationDistrict.value = ''
    locationImage.value = ''
    branchCount.value = 0
    branchId.value = null
    branchName.value = ''
    branchCode.value = ''
    branchLogo.value = ''
    branchIsActive.value = true
    clearPersisted(tenantId)
  }

  const ready = computed(() => locationId.value !== null && branchId.value !== null)

  // Sayfa yenilenince (route middleware'den, bkz. isg-desktop-context.global.ts)
  // çağrılır — localStorage'daki son seçimi OKUYUP BACKEND'DEN DOĞRULAR
  // (lokasyon/şube silinmiş veya erişim kalkmışsa sessizce hiçbir şey
  // yapmaz, kullanıcı normal seçim ekranına düşer). Zaten ready ise veya
  // hiç persisted kayıt yoksa hemen döner.
  const restoring = ref(false)
  const restore = async (tenantId?: string | number | null) => {
    if (ready.value || !tenantId || restoring.value) return
    const persisted = readPersisted(tenantId)
    if (!persisted) return

    restoring.value = true
    try {
      const location = await locationApi.get(tenantId, persisted.locationId)

      setLocation({
        id: location.id,
        name: location.name,
        city: location.city?.name,
        district: location.district?.name,
        image: resolveImageUrl(location.image),
        branchCount: location.branch_count ?? 0,
      }, tenantId)

      if (isStandaloneLocation.value) {
        const entities = await locationApi.businessEntities(location.id)
        const only = entities.find(e => e.type === 'company') ?? entities[0]
        if (only) {
          setBranch({
            id: only.pivot?.id ?? only.id,
            name: only.pivot?.brands?.[0]?.name || only.company?.name || only.name,
            code: only.pivot?.code,
            logo: only.pivot?.brands?.[0]?.logo_url,
            isActive: only.pivot?.is_active,
          }, tenantId)
        }
        return
      }

      if (persisted.branchId === null) return

      const entities = await locationApi.businessEntities(location.id)
      const branch = entities.find(e => (e.pivot?.id ?? e.id) === persisted.branchId)
      if (!branch) return

      setBranch({
        id: branch.pivot?.id ?? branch.id,
        name: branch.pivot?.brands?.[0]?.name || branch.company?.name || branch.name,
        code: branch.pivot?.code,
        logo: branch.pivot?.brands?.[0]?.logo_url,
        isActive: branch.pivot?.is_active,
      }, tenantId)
    } catch {
      // Lokasyon/şube artık yok ya da erişim yok — sessizce yoksay, middleware
      // ready:false görüp kullanıcıyı normal seçim ekranına yönlendirecek.
      clearPersisted(tenantId)
    } finally {
      restoring.value = false
    }
  }

  return {
    locationId, locationName, locationCity, locationDistrict, locationImage, branchCount,
    branchId, branchName, branchCode, branchLogo, branchIsActive,
    isStandaloneLocation, ready, restoring,
    setLocation, setBranch, reset, restore,
  }
})
