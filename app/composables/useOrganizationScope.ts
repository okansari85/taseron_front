import { Building2, Factory, Layers3, Tag } from '@lucide/vue'
import { useOrganizationStore } from '~/stores/organization'

type ScopeKind = 'tenant' | 'group' | 'company' | 'brand' | 'location' | 'area'
type ScopeOption = { id: string | number; name: string; description: string; icon: unknown }
type ModuleKey = 'dashboard' | 'groups' | 'companies' | 'brands' | 'locations' | 'hierarchy'
type ScopeState = { kind: ScopeKind; group: ScopeOption | null; company: ScopeOption | null; brand: ScopeOption | null; location: ScopeOption | null; area: ScopeOption | null }

export const useOrganizationScope = () => {
  const route = useRoute()
  const tenantStore = useTenantStore()
  const organizationStore = useOrganizationStore()
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
  const toOption = (id: string | number, name: string, description: string, icon: unknown): ScopeOption => ({ id, name, description, icon })

  const optionsForKind = (kind: ScopeKind): ScopeOption[] => {
    if (kind === 'tenant') return currentTenantOption.value ? [currentTenantOption.value] : []
    if (kind === 'group') return organizationStore.groups.map(item => toOption(item.id, item.name, 'Grup', Layers3))
    if (kind === 'company') return organizationStore.companies.map(item => toOption(item.id, item.name, 'Şirket', Building2))
    return []
  }

  const setScope = (kind: ScopeKind, selected: ScopeOption) => {
    if (kind === 'tenant') scope.value = { kind, group: null, company: null, brand: null, location: null, area: null }
    else if (kind === 'group') scope.value = { kind, group: selected, company: null, brand: null, location: null, area: null }
    else if (kind === 'company') scope.value = { kind, group: scope.value.group, company: selected, brand: null, location: null, area: null }
    else if (kind === 'brand') scope.value = { kind, group: scope.value.group, company: scope.value.company, brand: selected, location: null, area: null }
    else if (kind === 'location') scope.value = { ...scope.value, kind, location: selected, area: null }
    else scope.value = { ...scope.value, kind, area: selected }
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
    const key = kind === 'group' ? 'group' : kind === 'company' ? 'company' : kind === 'brand' ? 'brand' : kind === 'location' ? 'location' : 'area'
    const value = scope.value[key]
    if (value) setScope(kind, value)
  }

  watch(tenantId, resetForTenant, { immediate: true })

  return { scope, moduleKey, currentTenant, currentTenantOption, tenantLocationContext, operationalAreaContext, scopeKindLabel, scopeIcon, optionsForKind, setScope, resetForTenant, breadcrumbs, goToBreadcrumb }
}
