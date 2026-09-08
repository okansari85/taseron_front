import { defineStore } from 'pinia'
import { workspaceContextApi } from '~/api/workspace-context'
import type {
  WorkspaceLocationExpertContext,
  WorkspaceLocationOption,
  WorkspaceOperationalAreaOption,
  WorkspaceOrganizationOption,
} from '~/types/workspace-context'

export const useWorkspaceContextStore = defineStore('workspaceContext', () => {
  const bootstrapLoaded = ref(false)
  const operationalAreaEnabled = ref(false)
  const locationViewMode = ref<'location' | 'business_entity'>('location')
  const homeOrganizationId = ref<number | null>(null)
  const homeLocationId = ref<number | null>(null)
  const homeOperationalRegionId = ref<number | null>(null)
  const locationExpert = ref<WorkspaceLocationExpertContext>({ mode: 'none', regions: [] })

  const organizations = ref<WorkspaceOrganizationOption[]>([])
  const organizationsLoaded = ref(false)
  // Brand.id ve Organization.id ayrı id uzayları olduğu için cache key'i
  // "kind:id" şeklinde birleşik tutulur, yoksa aynı sayısal id'ye sahip bir
  // marka ve bir organizasyon düğümü birbirinin cache'ini ezebilir.
  const locationsCache = new Map<string, WorkspaceLocationOption[]>()
  const areasCache = new Map<number, { enabled: boolean; items: WorkspaceOperationalAreaOption[] }>()

  const locations = ref<WorkspaceLocationOption[]>([])
  const operationalAreas = ref<{ enabled: boolean; items: WorkspaceOperationalAreaOption[] }>({ enabled: false, items: [] })

  const selectedOrganizationId = ref<number | null>(null)
  const selectedOrganizationKind = ref<'organization' | 'brand'>('organization')
  const selectedLocationId = ref<number | null>(null)
  const selectedOperationalAreaId = ref<number | null>(null)

  // Header'daki 3 seçiciden aynı anda sadece biri açık olabilir — biri
  // açılınca diğeri otomatik kapanır (paneller sibling component olduğu
  // için @click.stop birbirlerinin document click-outside dinleyicisini
  // tetiklemiyor, bu yüzden paylaşılan tek bir state gerekiyor).
  const openSelector = ref<'organization' | 'location' | 'area' | null>(null)
  const toggleSelector = (key: 'organization' | 'location' | 'area') => {
    openSelector.value = openSelector.value === key ? null : key
  }
  const closeSelector = (key: 'organization' | 'location' | 'area') => {
    if (openSelector.value === key) openSelector.value = null
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  // init() tamamlanana kadar false kalır — sayfaların ilk veri çekişini
  // buna göre ertelemesi gerekir (bkz. workspace-context-page-fetch deseni),
  // yoksa context daha çözülmeden filtresiz bir liste bir an görünüp
  // ardından doğru veriyle değişir ("blink"). reset() dışında hiç geri
  // false yapılmaz — sadece tenant değişiminde yeniden başlar.
  const contextReady = ref(false)

  // Seçim sayfa yenilenince kaybolmasın diye tenant başına localStorage'a
  // yazılır. Sadece per-viewer bir kolaylık (bkz. CLAUDE.md) — sunucu
  // tarafında hiçbir şeyi etkilemez, sadece init() sırasında "home" yerine
  // hangi seçimle başlanacağına karar vermek için okunur.
  const currentTenantId = ref<string | null>(null)
  const storageKey = (tenantId: string) => `workspace-context:${tenantId}`
  type PersistedSelection = { organizationId: number; organizationKind: 'organization' | 'brand'; locationId: number | null; operationalAreaId: number | null }
  const readPersisted = (tenantId: string): PersistedSelection | null => {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(storageKey(tenantId))
      return raw ? (JSON.parse(raw) as PersistedSelection) : null
    } catch {
      return null
    }
  }
  const persist = () => {
    if (!import.meta.client || !currentTenantId.value || selectedOrganizationId.value === null) return
    try {
      const payload: PersistedSelection = {
        organizationId: selectedOrganizationId.value,
        organizationKind: selectedOrganizationKind.value,
        locationId: selectedLocationId.value,
        operationalAreaId: selectedOperationalAreaId.value,
      }
      localStorage.setItem(storageKey(currentTenantId.value), JSON.stringify(payload))
    } catch {
      // localStorage kullanılamıyorsa (gizli sekme vb.) sessizce yoksay.
    }
  }

  // Kullanıcının hiç 'organization' scope'u yoksa (yani accessibleTreeForUser boş
  // dönerse) seçici hiç render edilmemeli — bu görünürlük role değil scope'a bağlı.
  const hasAccess = computed(() => bootstrapLoaded.value && organizationsLoaded.value && organizations.value.length > 0)

  // Sayfaların "context değişince yeniden çek" watcher'ı için tek bir değer.
  // apiClient bu store'daki seçime göre header ekliyor (bkz. app/api/client.ts);
  // context değişince bu imza da değişir, sayfalar watch(contextSignature, ...)
  // ile tenantId değişimini izler gibi bunu da izlemeli — aksi halde header'da
  // seçim değişse bile o an açık olan liste sayfası eski veriyi göstermeye devam eder.
  const contextSignature = computed(() =>
    `${selectedOrganizationId.value}:${selectedOrganizationKind.value}:${selectedLocationId.value}:${selectedOperationalAreaId.value}`
  )

  const showOperationalAreaSelector = computed(
    () => operationalAreaEnabled.value && operationalAreas.value.enabled && operationalAreas.value.items.length > 0
  )

  // İSG uzmanı gibi organizasyon scope'u olmayıp doğrudan location_experts
  // üzerinden bir/birkaç operasyonel alana atanmış kullanıcılar için: normal
  // organizasyon/lokasyon akışı hiç gösterilmez, sadece operasyonel alan.
  const isLocationExpertOnly = computed(() => bootstrapLoaded.value && !hasAccess.value && locationExpert.value.mode !== 'none')
  const locationExpertLocked = computed(() => locationExpert.value.mode === 'locked')

  // Bu modda Lokasyon ayrıca seçilemez — seçili operasyonel alanın bağlı
  // olduğu lokasyon otomatik/disabled olarak gösterilir.
  const locationExpertActiveLocation = computed(() => {
    if (!isLocationExpertOnly.value) return null
    const region = locationExpert.value.regions.find(item => item.id === selectedOperationalAreaId.value)
    return region ? { id: region.location_id, name: region.location_name } : null
  })

  const fetchBootstrap = async (force = false) => {
    if (bootstrapLoaded.value && !force) return
    const data = await workspaceContextApi.bootstrap()
    operationalAreaEnabled.value = data.operational_area_enabled
    locationViewMode.value = data.location_view_mode
    homeOrganizationId.value = data.home.organization_id
    homeLocationId.value = data.home.location_id
    homeOperationalRegionId.value = data.home.operational_region_id
    locationExpert.value = data.location_expert
    bootstrapLoaded.value = true
  }

  const fetchOrganizations = async (force = false) => {
    if (organizationsLoaded.value && !force) return
    const data = await workspaceContextApi.organizations()
    organizations.value = data.items
    organizationsLoaded.value = true
  }

  const fetchLocations = async (id: number, kind: 'organization' | 'brand' = 'organization', force = false) => {
    const cacheKey = `${kind}:${id}`
    if (!force && locationsCache.has(cacheKey)) {
      locations.value = locationsCache.get(cacheKey) ?? []
      return
    }
    const data = await workspaceContextApi.locations(id, kind)
    locationsCache.set(cacheKey, data.items)
    locations.value = data.items
  }

  const fetchOperationalAreas = async (locationId: number, force = false) => {
    if (!force && areasCache.has(locationId)) {
      operationalAreas.value = areasCache.get(locationId) ?? { enabled: false, items: [] }
      return
    }
    const data = await workspaceContextApi.operationalAreas(locationId)
    const value = { enabled: data.enabled, items: data.items }
    areasCache.set(locationId, value)
    operationalAreas.value = value
  }

  const selectOrganization = async (id: number, kind: 'organization' | 'brand' = 'organization') => {
    if (selectedOrganizationId.value === id) return
    selectedOrganizationId.value = id
    selectedOrganizationKind.value = kind
    selectedLocationId.value = null
    selectedOperationalAreaId.value = null
    operationalAreas.value = { enabled: false, items: [] }
    await fetchLocations(id, kind)
    persist()
  }

  const selectLocation = async (id: number) => {
    if (selectedLocationId.value === id) return
    selectedLocationId.value = id
    selectedOperationalAreaId.value = null
    if (operationalAreaEnabled.value) {
      await fetchOperationalAreas(id)
    } else {
      operationalAreas.value = { enabled: false, items: [] }
    }
    persist()
  }

  const selectOperationalArea = (id: number) => {
    selectedOperationalAreaId.value = id
    persist()
  }

  // "Tüm Lokasyonlar" — seçili organizasyonun altındaki tüm lokasyonları
  // kapsayacak şekilde lokasyon daraltmasını kaldırır. Operasyonel Alan
  // combo'su da (belirli bir lokasyona bağlı olduğu için) otomatik kapanır.
  const clearLocation = () => {
    selectedLocationId.value = null
    selectedOperationalAreaId.value = null
    operationalAreas.value = { enabled: false, items: [] }
    persist()
  }

  const init = async (tenantId: string) => {
    currentTenantId.value = tenantId
    loading.value = true
    error.value = null
    try {
      await Promise.all([fetchBootstrap(), fetchOrganizations()])
      if (!hasAccess.value) {
        if (locationExpert.value.mode !== 'none') {
          const regions = locationExpert.value.regions
          operationalAreas.value = { enabled: true, items: regions.map(r => ({ id: r.id, name: r.name })) }
          selectedOperationalAreaId.value = locationExpert.value.mode === 'locked' ? (regions[0]?.id ?? null) : null
        }
        return
      }

      const persisted = readPersisted(tenantId)
      const persistedOrgValid = persisted && organizations.value.some(item => item.id === persisted.organizationId)

      const orgId = persistedOrgValid ? persisted!.organizationId : (homeOrganizationId.value ?? organizations.value[0]?.id ?? null)
      if (!orgId) return
      selectedOrganizationId.value = orgId
      selectedOrganizationKind.value = persistedOrgValid ? persisted!.organizationKind : 'organization'
      await fetchLocations(orgId, selectedOrganizationKind.value)

      const wantedLocationId = persistedOrgValid ? persisted!.locationId : homeLocationId.value
      const locId = wantedLocationId && locations.value.some(item => item.id === wantedLocationId)
        ? wantedLocationId
        : null
      if (!locId) return
      selectedLocationId.value = locId

      if (operationalAreaEnabled.value) {
        await fetchOperationalAreas(locId)
        const wantedAreaId = persistedOrgValid ? persisted!.operationalAreaId : homeOperationalRegionId.value
        if (wantedAreaId && operationalAreas.value.items.some(item => item.id === wantedAreaId)) {
          selectedOperationalAreaId.value = wantedAreaId
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Çalışma bağlamı alınamadı.'
      throw err
    } finally {
      loading.value = false
      contextReady.value = true
    }
  }

  // Tenant değişince (route param değişimi) tüm state ve cache sıfırlanır,
  // ardından init() tekrar çağrılmalı — bkz. TenantHeader.vue'daki watch(tenantId).
  const reset = () => {
    currentTenantId.value = null
    contextReady.value = false
    bootstrapLoaded.value = false
    operationalAreaEnabled.value = false
    locationViewMode.value = 'location'
    homeOrganizationId.value = null
    homeLocationId.value = null
    homeOperationalRegionId.value = null
    locationExpert.value = { mode: 'none', regions: [] }
    organizations.value = []
    organizationsLoaded.value = false
    locationsCache.clear()
    areasCache.clear()
    locations.value = []
    operationalAreas.value = { enabled: false, items: [] }
    selectedOrganizationId.value = null
    selectedOrganizationKind.value = 'organization'
    selectedLocationId.value = null
    selectedOperationalAreaId.value = null
    openSelector.value = null
    error.value = null
  }

  return {
    operationalAreaEnabled,
    locationViewMode,
    organizations,
    locations,
    operationalAreas,
    selectedOrganizationId,
    selectedOrganizationKind,
    selectedLocationId,
    selectedOperationalAreaId,
    openSelector,
    loading,
    error,
    hasAccess,
    contextReady,
    contextSignature,
    showOperationalAreaSelector,
    isLocationExpertOnly,
    locationExpertLocked,
    locationExpertActiveLocation,
    init,
    reset,
    selectOrganization,
    selectLocation,
    selectOperationalArea,
    clearLocation,
    toggleSelector,
    closeSelector,
  }
})
