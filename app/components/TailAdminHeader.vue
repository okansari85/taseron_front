<template>
  <header class="sticky top-0 z-[999] w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="flex w-full items-center justify-between px-4 py-3 lg:px-6 lg:py-3.5">
      <div class="flex min-w-0 items-center gap-3">
        <button class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300 lg:h-11 lg:w-11" @click="handleSidebar">
          <Menu :size="20" />
        </button>
        <div class="hidden min-w-0 sm:block">
          <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <template v-for="(item, index) in breadcrumbs" :key="`${item.type}-${item.id}`">
              <button type="button" class="truncate transition hover:text-brand-500" :class="index === breadcrumbs.length - 1 ? 'font-medium text-gray-600 dark:text-gray-300' : ''" @click="goToBreadcrumb(item.type, item.id)">
                {{ item.name }}
              </button>
              <span v-if="index < breadcrumbs.length - 1" class="text-gray-300 dark:text-gray-700">/</span>
            </template>
          </div>
          <p class="truncate text-[10px] font-medium text-gray-400 dark:text-gray-500">Taseron Management</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div v-if="isTenantWorkspace" class="relative hidden lg:flex items-center gap-2">
          <button
            v-if="previousScope"
            type="button"
            class="flex min-w-[170px] max-w-[210px] items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-brand-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40"
            :title="`Geri dön: ${previousScope.name}`"
            @click="goBackOneLevel"
          >
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <component :is="previousScope.icon" :size="14" />
            </span>
            <span class="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{{ previousScope.name }}</span>
            <ChevronLeft :size="14" class="shrink-0 text-gray-400" />
          </button>

          <button
            type="button"
            class="flex min-w-[220px] max-w-[260px] items-center justify-between gap-3 rounded-lg border border-brand-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-brand-400 dark:border-brand-500/40 dark:bg-gray-900 dark:hover:border-brand-500/70"
            :title="`Kapsam: ${currentScopeName}`"
            @click="scopeSelectorOpen = !scopeSelectorOpen"
          >
            <span class="flex min-w-0 items-center gap-2.5">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><component :is="currentScopeIcon" :size="15" /></span>
              <span class="min-w-0">
                <span class="block text-[9px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ currentScopeLabel }}</span>
                <span class="block truncate text-xs font-semibold text-gray-800 dark:text-white/90">{{ currentScopeName }}</span>
              </span>
            </span>
            <ChevronDown :size="15" class="shrink-0 text-gray-400 transition-transform" :class="scopeSelectorOpen ? 'rotate-180' : ''" />
          </button>

          <div v-if="scopeSelectorOpen" class="absolute right-0 top-full z-[1000] mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <p class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{{ nextScopeLabel }} seçin</p>
            <button v-for="option in currentScopeOptions" :key="option.id" type="button" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5" @click="selectScopeOption(option)">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"><component :is="option.icon" :size="13" /></span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{{ option.name }}</span>
                <span class="block text-[10px] text-gray-400">{{ option.description }}</span>
              </span>
            </button>
          </div>
        </div>

        <button class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" title="Tema" @click="toggleTheme">
          <Sun v-if="isDark" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <button class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" title="Bildirimler"><Bell :size="18" /></button>

        <div class="relative hidden sm:block">
          <button class="flex items-center gap-3 border-l border-gray-200 pl-3 text-left dark:border-gray-800" title="Profil menüsü" @click="profileOpen = !profileOpen">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">{{ initials }}</div>
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ auth.user.value?.name || 'Kullanıcı' }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ roleLabel }}</p>
            </div>
          </button>
          <div v-if="profileOpen" class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <button class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="handleLogout">Çıkış Yap</button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Bell, Building2, ChevronDown, ChevronLeft, Factory, Layers3, Menu, Moon, Sun, Tag } from '@lucide/vue'

type ScopeLevel = 'tenant' | 'group' | 'company' | 'brand' | 'location'
type ScopeOption = { id: string | number; name: string; description: string; icon: unknown }
type Breadcrumb = { type: ScopeLevel; id: string | number; name: string }

const route = useRoute()
const router = useRouter()
const { toggle, toggleMobile } = useTailAdminSidebar()
const { isDark, toggle: toggleTheme } = useTailAdminTheme()
const auth = useAuth()
const tenantStore = useTenantStore()

const profileOpen = ref(false)
const scopeSelectorOpen = ref(false)
const scopeLevel = useState<ScopeLevel>('organization-scope-level', () => 'tenant')
const selectedGroup = useState<ScopeOption | null>('organization-scope-group', () => null)
const selectedCompany = useState<ScopeOption | null>('organization-scope-company', () => null)
const selectedBrand = useState<ScopeOption | null>('organization-scope-brand', () => null)
const selectedLocation = useState<ScopeOption | null>('organization-scope-location', () => null)

const tenantId = computed(() => {
  const value = route.params.tenantId
  return Array.isArray(value) ? value[0] : value
})
const isTenantWorkspace = computed(() => Boolean(tenantId.value))
const currentTenant = computed(() => tenantStore.currentTenant)

const groupOptions: ScopeOption[] = [
  { id: 'durable', name: 'Dayanıklı Tüketim Grubu', description: 'Grup kapsamına geç', icon: Layers3 },
  { id: 'automotive', name: 'Otomotiv Grubu', description: 'Grup kapsamına geç', icon: Layers3 },
  { id: 'energy', name: 'Enerji Grubu', description: 'Grup kapsamına geç', icon: Layers3 },
]

const companyOptions: Record<string, ScopeOption[]> = {
  durable: [
    { id: 'arcelik', name: 'Arçelik A.Ş.', description: 'Şirket kapsamına geç', icon: Building2 },
    { id: 'arcelik-pazarlama', name: 'Arçelik Pazarlama A.Ş.', description: 'Şirket kapsamına geç', icon: Building2 },
    { id: 'beko', name: 'Beko Elektronik A.Ş.', description: 'Şirket kapsamına geç', icon: Building2 },
  ],
  automotive: [
    { id: 'ford', name: 'Ford Otosan', description: 'Şirket kapsamına geç', icon: Building2 },
    { id: 'tofas', name: 'Tofaş Türk Otomobil Fabrikası A.Ş.', description: 'Şirket kapsamına geç', icon: Building2 },
  ],
  energy: [
    { id: 'tupras', name: 'Tüpraş', description: 'Şirket kapsamına geç', icon: Building2 },
    { id: 'aygaz', name: 'Aygaz', description: 'Şirket kapsamına geç', icon: Building2 },
  ],
}

const brandOptions: Record<string, ScopeOption[]> = {
  arcelik: [
    { id: 'arcelik-brand', name: 'Arçelik', description: 'Marka kapsamına geç', icon: Tag },
    { id: 'beko-brand', name: 'Beko', description: 'Marka kapsamına geç', icon: Tag },
  ],
  'arcelik-pazarlama': [
    { id: 'arcelik-pazarlama-brand', name: 'Arçelik', description: 'Marka kapsamına geç', icon: Tag },
    { id: 'beko-pazarlama-brand', name: 'Beko', description: 'Marka kapsamına geç', icon: Tag },
  ],
  beko: [
    { id: 'beko-electronic-brand', name: 'Beko', description: 'Marka kapsamına geç', icon: Tag },
  ],
}

const locationOptions: Record<string, ScopeOption[]> = {
  'arcelik-brand': [
    { id: 'eskisehir', name: 'Eskişehir Kampüsü', description: 'Lokasyon kapsamına geç', icon: Factory },
    { id: 'beylikduzu', name: 'Beylikdüzü Kampüsü', description: 'Lokasyon kapsamına geç', icon: Factory },
  ],
  'beko-brand': [
    { id: 'beylikduzu-beko', name: 'Beylikdüzü Kampüsü', description: 'Lokasyon kapsamına geç', icon: Factory },
    { id: 'cayirova', name: 'Çayırova Kampüsü', description: 'Lokasyon kapsamına geç', icon: Factory },
  ],
  'arcelik-pazarlama-brand': [
    { id: 'sutluce', name: 'Sütlüce Genel Müdürlük', description: 'Lokasyon kapsamına geç', icon: Factory },
  ],
  'beko-pazarlama-brand': [
    { id: 'beylikduzu-pazarlama', name: 'Beylikdüzü Kampüsü', description: 'Lokasyon kapsamına geç', icon: Factory },
  ],
  'beko-electronic-brand': [
    { id: 'cayirova-electronic', name: 'Çayırova Kampüsü', description: 'Lokasyon kapsamına geç', icon: Factory },
  ],
}

const currentScopeLabel = computed(() => ({ tenant: 'Workspace', group: 'Grup', company: 'Şirket', brand: 'Marka', location: 'Lokasyon' }[scopeLevel.value]))
const currentScopeName = computed(() => {
  if (scopeLevel.value === 'tenant') return currentTenant.value?.name || 'Tenant seçin'
  if (scopeLevel.value === 'group') return selectedGroup.value?.name || 'Grup seçin'
  if (scopeLevel.value === 'company') return selectedCompany.value?.name || 'Şirket seçin'
  if (scopeLevel.value === 'brand') return selectedBrand.value?.name || 'Marka seçin'
  return selectedLocation.value?.name || 'Lokasyon seçin'
})
const currentScopeIcon = computed(() => ({ tenant: Building2, group: Layers3, company: Building2, brand: Tag, location: Factory }[scopeLevel.value]))
const nextScopeLabel = computed(() => ({ tenant: 'Grup', group: 'Şirket', company: 'Marka', brand: 'Lokasyon', location: 'Lokasyon' }[scopeLevel.value]))
const currentScopeOptions = computed<ScopeOption[]>(() => {
  if (scopeLevel.value === 'tenant') return groupOptions
  if (scopeLevel.value === 'group') return companyOptions[selectedGroup.value?.id as string] || []
  if (scopeLevel.value === 'company') return brandOptions[selectedCompany.value?.id as string] || []
  if (scopeLevel.value === 'brand') return locationOptions[selectedBrand.value?.id as string] || []
  return []
})

const previousScope = computed<ScopeOption | null>(() => {
  if (scopeLevel.value === 'group' && currentTenant.value) return { id: currentTenant.value.id, name: currentTenant.value.name, description: '', icon: Building2 }
  if (scopeLevel.value === 'company' && selectedGroup.value) return selectedGroup.value
  if (scopeLevel.value === 'brand' && selectedCompany.value) return selectedCompany.value
  if (scopeLevel.value === 'location' && selectedBrand.value) return selectedBrand.value
  return null
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  const items: Breadcrumb[] = []
  if (currentTenant.value) items.push({ type: 'tenant', id: currentTenant.value.id, name: currentTenant.value.name })
  if (selectedGroup.value && scopeLevel.value !== 'tenant') items.push({ type: 'group', id: selectedGroup.value.id, name: selectedGroup.value.name })
  if (selectedCompany.value && ['company', 'brand', 'location'].includes(scopeLevel.value)) items.push({ type: 'company', id: selectedCompany.value.id, name: selectedCompany.value.name })
  if (selectedBrand.value && ['brand', 'location'].includes(scopeLevel.value)) items.push({ type: 'brand', id: selectedBrand.value.id, name: selectedBrand.value.name })
  if (selectedLocation.value && scopeLevel.value === 'location') items.push({ type: 'location', id: selectedLocation.value.id, name: selectedLocation.value.name })
  return items
})

const selectScopeOption = (option: ScopeOption) => {
  if (scopeLevel.value === 'tenant') {
    selectedGroup.value = option
    selectedCompany.value = null
    selectedBrand.value = null
    selectedLocation.value = null
    scopeLevel.value = 'group'
  } else if (scopeLevel.value === 'group') {
    selectedCompany.value = option
    selectedBrand.value = null
    selectedLocation.value = null
    scopeLevel.value = 'company'
  } else if (scopeLevel.value === 'company') {
    selectedBrand.value = option
    selectedLocation.value = null
    scopeLevel.value = 'brand'
  } else if (scopeLevel.value === 'brand') {
    selectedLocation.value = option
    scopeLevel.value = 'location'
  }
  scopeSelectorOpen.value = false
}

const goBackOneLevel = () => {
  if (scopeLevel.value === 'group') goToBreadcrumb('tenant', currentTenant.value?.id ?? '')
  else if (scopeLevel.value === 'company') goToBreadcrumb('group', selectedGroup.value?.id ?? '')
  else if (scopeLevel.value === 'brand') goToBreadcrumb('company', selectedCompany.value?.id ?? '')
  else if (scopeLevel.value === 'location') goToBreadcrumb('brand', selectedBrand.value?.id ?? '')
}

const goToBreadcrumb = (type: ScopeLevel, _id: string | number) => {
  if (type === 'tenant') {
    scopeLevel.value = 'tenant'
    selectedGroup.value = null
    selectedCompany.value = null
    selectedBrand.value = null
    selectedLocation.value = null
  } else if (type === 'group') {
    scopeLevel.value = 'group'
    selectedCompany.value = null
    selectedBrand.value = null
    selectedLocation.value = null
  } else if (type === 'company') {
    scopeLevel.value = 'company'
    selectedBrand.value = null
    selectedLocation.value = null
  } else if (type === 'brand') {
    scopeLevel.value = 'brand'
    selectedLocation.value = null
  } else {
    scopeLevel.value = 'location'
  }
  scopeSelectorOpen.value = false
}

const initials = computed(() => {
  const name = auth.user.value?.name?.trim() || 'K'
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR')
})
const roleLabel = computed(() => {
  const role = auth.user.value?.roles?.[0]
  const labels: Record<string, string> = { 'super-admin': 'Sistem Yöneticisi', 'tenant-admin': 'Tenant Yöneticisi' }
  return role ? labels[role] || role : 'Kullanıcı'
})

watch(isTenantWorkspace, async (enabled) => {
  if (!enabled || tenantStore.tenants.length > 0) return
  await tenantStore.fetchTenants()
}, { immediate: true })

watch(tenantId, () => {
  scopeLevel.value = 'tenant'
  selectedGroup.value = null
  selectedCompany.value = null
  selectedBrand.value = null
  selectedLocation.value = null
}, { immediate: true })

const handleSidebar = () => {
  if (import.meta.client && window.innerWidth < 1024) toggleMobile()
  else toggle()
}
const handleLogout = async () => {
  profileOpen.value = false
  await auth.logout()
  await router.push('/login')
}
</script>
