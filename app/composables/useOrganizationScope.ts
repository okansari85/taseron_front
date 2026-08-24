import { Building2, Factory, Layers3, Tag } from '@lucide/vue'

type ScopeKind = 'tenant' | 'group' | 'company' | 'brand' | 'location' | 'area'
type ScopeOption = { id: string | number; name: string; description: string; icon: unknown }
type ModuleKey = 'dashboard' | 'groups' | 'companies' | 'brands' | 'locations' | 'hierarchy'
type ScopeState = { kind: ScopeKind; group: ScopeOption | null; company: ScopeOption | null; brand: ScopeOption | null; location: ScopeOption | null; area: ScopeOption | null }

const groupOptions: ScopeOption[] = [
  { id: 'durable', name: 'Dayanıklı Tüketim Grubu', description: 'Grup', icon: Layers3 },
  { id: 'automotive', name: 'Otomotiv Grubu', description: 'Grup', icon: Layers3 },
  { id: 'energy', name: 'Enerji Grubu', description: 'Grup', icon: Layers3 },
]
const companyOptions: Record<string, ScopeOption[]> = {
  durable: [
    { id: 'arcelik', name: 'Arçelik A.Ş.', description: 'Şirket', icon: Building2 },
    { id: 'arcelik-pazarlama', name: 'Arçelik Pazarlama A.Ş.', description: 'Şirket', icon: Building2 },
    { id: 'beko', name: 'Beko Elektronik A.Ş.', description: 'Şirket', icon: Building2 },
  ],
}
const brandOptions: Record<string, ScopeOption[]> = {
  arcelik: [
    { id: 'arcelik-brand', name: 'Arçelik', description: 'Marka', icon: Tag },
    { id: 'beko-brand', name: 'Beko', description: 'Marka', icon: Tag },
  ],
}
const locationOptions: Record<string, ScopeOption[]> = {
  durable: [
    { id: 'eskisehir-group', name: 'Eskişehir Kampüsü', description: 'Tesis', icon: Factory },
    { id: 'beylikduzu-group', name: 'Beylikdüzü Kampüsü', description: 'Tesis', icon: Factory },
    { id: 'sutluce-group', name: 'Sütlüce Genel Müdürlük', description: 'Tesis', icon: Factory },
  ],
  arcelik: [
    { id: 'eskisehir', name: 'Eskişehir Kampüsü', description: 'Tesis', icon: Factory },
    { id: 'beylikduzu', name: 'Beylikdüzü Kampüsü', description: 'Tesis', icon: Factory },
  ],
  'arcelik-pazarlama': [
    { id: 'sutluce', name: 'Sütlüce Genel Müdürlük', description: 'Tesis', icon: Factory },
  ],
}
const areaOptions: Record<string, ScopeOption[]> = {
  eskisehir: [
    { id: 'assembly', name: 'Montaj Alanı', description: 'Operasyonel alan', icon: Layers3 },
    { id: 'warehouse', name: 'Depo Alanı', description: 'Operasyonel alan', icon: Layers3 },
  ],
  beylikduzu: [
    { id: 'production', name: 'Üretim Alanı', description: 'Operasyonel alan', icon: Layers3 },
    { id: 'maintenance', name: 'Bakım Alanı', description: 'Operasyonel alan', icon: Layers3 },
  ],
  sutluce: [
    { id: 'office', name: 'Ofis Alanı', description: 'Operasyonel alan', icon: Layers3 },
  ],
}

export const useOrganizationScope = () => {
  const route = useRoute()
  const tenantStore = useTenantStore()
  const scope = useState<ScopeState>('organization-scope', () => ({ kind: 'tenant', group: null, company: null, brand: null, location: null, area: null }))
  const tenantId = computed(() => Array.isArray(route.params.tenantId) ? route.params.tenantId[0] : route.params.tenantId)
  const currentTenant = computed(() => tenantStore.currentTenant)
  const moduleKey = computed<ModuleKey>(() => {
    const path = route.path
    if (path.includes('/organization/companies')) return 'companies'
    if (path.includes('/organization/brands')) return 'brands'
    if (path.includes('/organization/hierarchy')) return 'hierarchy'
    if (path.includes('/organization/groups')) return 'groups'
    if (path.includes('/locations')) return 'locations'
    return 'dashboard'
  })

  const currentTenantOption = computed<ScopeOption | null>(() => currentTenant.value ? { id: currentTenant.value.id, name: currentTenant.value.name, description: 'Tenant', icon: Building2 } : null)
  const tenantLocationContext = computed(() => scope.value.location)
  const operationalAreaContext = computed(() => scope.value.area)

  const scopeKindLabel = (kind: ScopeKind) => ({ tenant: 'Tenant', group: 'Grup', company: 'Şirket', brand: 'Marka', location: 'Tesis', area: 'Operasyonel Alan' }[kind])
  const scopeIcon = (kind: ScopeKind) => ({ tenant: Building2, group: Layers3, company: Building2, brand: Tag, location: Factory, area: Layers3 }[kind])

  const optionsForKind = (kind: ScopeKind): ScopeOption[] => {
    if (kind === 'tenant') return currentTenantOption.value ? [currentTenantOption.value] : []
    if (kind === 'group') return groupOptions
    if (kind === 'company') return scope.value.group ? companyOptions[String(scope.value.group.id)] || [] : []
    if (kind === 'brand') return scope.value.company ? brandOptions[String(scope.value.company.id)] || [] : []
    if (kind === 'location') {
      if (scope.value.company) return locationOptions[String(scope.value.company.id)] || []
      if (scope.value.group) return locationOptions[String(scope.value.group.id)] || []
      return []
    }
    if (kind === 'area') return scope.value.location ? areaOptions[String(scope.value.location.id)] || [] : []
    return []
  }

  const setScope = (kind: ScopeKind, option: ScopeOption) => {
    if (kind === 'tenant') scope.value = { kind, group: null, company: null, brand: null, location: null, area: null }
    else if (kind === 'group') scope.value = { kind, group: option, company: null, brand: null, location: null, area: null }
    else if (kind === 'company') scope.value = { kind, group: scope.value.group, company: option, brand: null, location: null, area: null }
    else if (kind === 'brand') scope.value = { kind, group: scope.value.group, company: scope.value.company, brand: option, location: null, area: null }
    else if (kind === 'location') scope.value = { ...scope.value, kind, location: option, area: null }
    else scope.value = { ...scope.value, kind, area: option }
  }

  const resetForTenant = () => { scope.value = { kind: 'tenant', group: null, company: null, brand: null, location: null, area: null } }
  const breadcrumbs = computed(() => {
    const items: { kind: ScopeKind; id: string | number; name: string }[] = []
    if (currentTenant.value) items.push({ kind: 'tenant', id: currentTenant.value.id, name: currentTenant.value.name })
    if (scope.value.group) items.push({ kind: 'group', id: scope.value.group.id, name: scope.value.group.name })
    if (scope.value.company) items.push({ kind: 'company', id: scope.value.company.id, name: scope.value.company.name })
    if (scope.value.brand) items.push({ kind: 'brand', id: scope.value.brand.id, name: scope.value.brand.name })
    if (scope.value.location) items.push({ kind: 'location', id: scope.value.location.id, name: scope.value.location.name })
    if (scope.value.area) items.push({ kind: 'area', id: scope.value.area.id, name: scope.value.area.name })
    return items
  })
  const goToBreadcrumb = (kind: ScopeKind) => {
    if (kind === 'tenant') return resetForTenant()
    const value = scope.value[kind === 'group' ? 'group' : kind === 'company' ? 'company' : kind === 'brand' ? 'brand' : kind === 'location' ? 'location' : 'area']
    if (value) setScope(kind, value)
  }

  watch(tenantId, resetForTenant, { immediate: true })

  return { scope, moduleKey, currentTenant, currentTenantOption, tenantLocationContext, operationalAreaContext, scopeKindLabel, scopeIcon, optionsForKind, setScope, resetForTenant, breadcrumbs, goToBreadcrumb }
}
