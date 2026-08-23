import { Building2, Factory, Layers3, Tag } from '@lucide/vue'

type ScopeKind = 'tenant' | 'group' | 'company' | 'brand' | 'location'

type ScopeOption = {
  id: string | number
  name: string
  description: string
  icon: unknown
}

type ModuleKey = 'dashboard' | 'groups' | 'companies' | 'brands' | 'locations' | 'hierarchy'

type ScopeState = {
  kind: ScopeKind
  group: ScopeOption | null
  company: ScopeOption | null
  brand: ScopeOption | null
  location: ScopeOption | null
}

const groupOptions: ScopeOption[] = [
  { id: 'durable', name: 'Dayanıklı Tüketim Grubu', description: 'Grup kapsamı', icon: Layers3 },
  { id: 'automotive', name: 'Otomotiv Grubu', description: 'Grup kapsamı', icon: Layers3 },
  { id: 'energy', name: 'Enerji Grubu', description: 'Grup kapsamı', icon: Layers3 },
]

const companyOptions: Record<string, ScopeOption[]> = {
  durable: [
    { id: 'arcelik', name: 'Arçelik A.Ş.', description: 'Şirket kapsamı', icon: Building2 },
    { id: 'arcelik-pazarlama', name: 'Arçelik Pazarlama A.Ş.', description: 'Şirket kapsamı', icon: Building2 },
    { id: 'beko', name: 'Beko Elektronik A.Ş.', description: 'Şirket kapsamı', icon: Building2 },
  ],
  automotive: [
    { id: 'ford', name: 'Ford Otosan', description: 'Şirket kapsamı', icon: Building2 },
    { id: 'tofas', name: 'Tofaş Türk Otomobil Fabrikası A.Ş.', description: 'Şirket kapsamı', icon: Building2 },
  ],
  energy: [
    { id: 'tupras', name: 'Tüpraş', description: 'Şirket kapsamı', icon: Building2 },
    { id: 'aygaz', name: 'Aygaz', description: 'Şirket kapsamı', icon: Building2 },
  ],
}

const brandOptions: Record<string, ScopeOption[]> = {
  arcelik: [
    { id: 'arcelik-brand', name: 'Arçelik', description: 'Marka kapsamı', icon: Tag },
    { id: 'beko-brand', name: 'Beko', description: 'Marka kapsamı', icon: Tag },
  ],
  'arcelik-pazarlama': [
    { id: 'arcelik-pazarlama-brand', name: 'Arçelik', description: 'Marka kapsamı', icon: Tag },
    { id: 'beko-pazarlama-brand', name: 'Beko', description: 'Marka kapsamı', icon: Tag },
  ],
  beko: [
    { id: 'beko-electronic-brand', name: 'Beko', description: 'Marka kapsamı', icon: Tag },
  ],
}

const locationOptions: Record<string, ScopeOption[]> = {
  arcelik: [
    { id: 'eskisehir', name: 'Eskişehir Kampüsü', description: 'Lokasyon kapsamı', icon: Factory },
    { id: 'beylikduzu', name: 'Beylikdüzü Kampüsü', description: 'Lokasyon kapsamı', icon: Factory },
  ],
  'arcelik-pazarlama': [
    { id: 'sutluce', name: 'Sütlüce Genel Müdürlük', description: 'Lokasyon kapsamı', icon: Factory },
  ],
  'arcelik-brand': [
    { id: 'eskisehir-brand', name: 'Eskişehir Kampüsü', description: 'Lokasyon kapsamı', icon: Factory },
    { id: 'beylikduzu-brand', name: 'Beylikdüzü Kampüsü', description: 'Lokasyon kapsamı', icon: Factory },
  ],
  'beko-brand': [
    { id: 'beylikduzu-beko', name: 'Beylikdüzü Kampüsü', description: 'Lokasyon kapsamı', icon: Factory },
    { id: 'cayirova', name: 'Çayırova Kampüsü', description: 'Lokasyon kapsamı', icon: Factory },
  ],
}

const moduleConfig: Record<ModuleKey, ScopeKind[]> = {
  dashboard: ['tenant'],
  groups: ['tenant'],
  companies: ['group'],
  brands: ['group', 'company'],
  locations: ['group', 'company', 'brand'],
  hierarchy: ['group', 'company'],
}

export const useOrganizationScope = () => {
  const route = useRoute()
  const tenantStore = useTenantStore()

  const scope = useState<ScopeState>('organization-scope', () => ({
    kind: 'tenant',
    group: null,
    company: null,
    brand: null,
    location: null,
  }))

  const tenantId = computed(() => {
    const value = route.params.tenantId
    return Array.isArray(value) ? value[0] : value
  })

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

  const allowedKinds = computed(() => moduleConfig[moduleKey.value])
  const currentScope = computed(() => {
    if (scope.value.kind === 'tenant') return currentTenant.value ? { id: currentTenant.value.id, name: currentTenant.value.name, description: 'Workspace kapsamı', icon: Building2 } : null
    if (scope.value.kind === 'group') return scope.value.group
    if (scope.value.kind === 'company') return scope.value.company
    if (scope.value.kind === 'brand') return scope.value.brand
    return scope.value.location
  })

  const scopeKindLabel = (kind: ScopeKind) => ({
    tenant: 'Workspace',
    group: 'Grup',
    company: 'Şirket',
    brand: 'Marka',
    location: 'Lokasyon',
  }[kind])

  const scopeIcon = (kind: ScopeKind) => ({
    tenant: Building2,
    group: Layers3,
    company: Building2,
    brand: Tag,
    location: Factory,
  }[kind])

  const optionsForKind = (kind: ScopeKind): ScopeOption[] => {
    if (kind === 'tenant') return currentTenant.value ? [{ id: currentTenant.value.id, name: currentTenant.value.name, description: 'Workspace kapsamı', icon: Building2 }] : []
    if (kind === 'group') return groupOptions
    if (kind === 'company') return scope.value.group ? (companyOptions[String(scope.value.group.id)] || []) : groupOptions.flatMap(group => companyOptions[String(group.id)] || [])
    if (kind === 'brand') return scope.value.company ? (brandOptions[String(scope.value.company.id)] || []) : []
    if (kind === 'location') {
      if (scope.value.brand) return locationOptions[String(scope.value.brand.id)] || []
      if (scope.value.company) return locationOptions[String(scope.value.company.id)] || []
      return []
    }
    return []
  }

  const setScope = (kind: ScopeKind, option: ScopeOption) => {
    if (kind === 'tenant') {
      scope.value = { kind, group: null, company: null, brand: null, location: null }
      return
    }

    if (kind === 'group') {
      scope.value = { kind, group: option, company: null, brand: null, location: null }
      return
    }

    if (kind === 'company') {
      scope.value = { kind, group: scope.value.group, company: option, brand: null, location: null }
      return
    }

    if (kind === 'brand') {
      scope.value = { kind, group: scope.value.group, company: scope.value.company, brand: option, location: null }
      return
    }

    scope.value = { ...scope.value, kind, location: option }
  }

  const resetForTenant = () => {
    scope.value = { kind: 'tenant', group: null, company: null, brand: null, location: null }
  }

  const breadcrumbs = computed(() => {
    const items: { kind: ScopeKind; id: string | number; name: string }[] = []
    if (currentTenant.value) items.push({ kind: 'tenant', id: currentTenant.value.id, name: currentTenant.value.name })
    if (scope.value.group) items.push({ kind: 'group', id: scope.value.group.id, name: scope.value.group.name })
    if (scope.value.company) items.push({ kind: 'company', id: scope.value.company.id, name: scope.value.company.name })
    if (scope.value.brand) items.push({ kind: 'brand', id: scope.value.brand.id, name: scope.value.brand.name })
    if (scope.value.location) items.push({ kind: 'location', id: scope.value.location.id, name: scope.value.location.name })
    return items
  })

  const goToBreadcrumb = (kind: ScopeKind) => {
    if (kind === 'tenant') return resetForTenant()
    if (kind === 'group' && scope.value.group) return setScope('group', scope.value.group)
    if (kind === 'company' && scope.value.company) return setScope('company', scope.value.company)
    if (kind === 'brand' && scope.value.brand) return setScope('brand', scope.value.brand)
    if (kind === 'location' && scope.value.location) return setScope('location', scope.value.location)
  }

  watch(tenantId, () => resetForTenant(), { immediate: true })

  return {
    scope,
    moduleKey,
    allowedKinds,
    currentScope,
    currentTenant,
    tenantId,
    scopeKindLabel,
    scopeIcon,
    optionsForKind,
    setScope,
    resetForTenant,
    breadcrumbs,
    goToBreadcrumb,
  }
}
