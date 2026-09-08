<template>
  <div>
    <div v-if="isMobileOpen" class="fixed inset-0 z-[9998] bg-black/30 lg:hidden" @click="closeMobile"></div>
    <aside :class="['fixed left-0 top-0 z-[9999] flex h-screen flex-col border-r border-gray-200 bg-white px-5 transition-all duration-300 dark:border-gray-800 dark:bg-gray-900', isExpanded ? 'w-[290px]' : 'w-[90px]', isMobileOpen ? 'w-[290px] translate-x-0' : '-translate-x-full lg:translate-x-0']">
      <div :class="['flex py-8', isExpanded ? 'justify-start' : 'justify-center']">
        <NuxtLink :to="basePath" class="flex items-center gap-3">
          <img v-if="groupBrandLogo" :src="groupBrandLogo" class="h-9 w-9 shrink-0 rounded-lg border border-gray-100 object-contain dark:border-gray-800" alt="" />
          <span v-else class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white" :style="groupColor ? { backgroundColor: groupColor } : undefined">T</span>
          <span v-if="isExpanded" class="min-w-0">
            <span class="block truncate text-lg font-semibold text-gray-800 dark:text-white/90">Taseron</span>
            <span class="block truncate text-xs font-medium text-gray-400">{{ groupName || tenantName }}</span>
          </span>
        </NuxtLink>
      </div>
      <nav class="no-scrollbar flex flex-1 flex-col overflow-y-auto pb-6">
        <div class="flex flex-col gap-1">
          <template v-for="item in menuItems" :key="item.path">
            <NuxtLink
              v-if="!item.children"
              :to="item.path"
              :class="['flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition', isItemActive(item.path) ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5', isExpanded ? 'justify-start' : 'justify-center']"
              @click="closeMobile"
            >
              <component :is="item.icon" :size="17" /><span v-if="isExpanded" class="truncate">{{ item.title }}</span>
            </NuxtLink>
            <div v-else>
              <div v-if="isExpanded" class="flex items-center gap-1">
                <NuxtLink v-if="item.to" :to="item.to" class="flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5" @click="closeMobile(); openGroups[item.path] = true">
                  <component :is="item.icon" :size="17" /><span class="flex-1 truncate text-left">{{ item.title }}</span>
                </NuxtLink>
                <button v-else type="button" class="flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300" @click="toggleGroup(item.path)">
                  <component :is="item.icon" :size="17" /><span class="flex-1 truncate text-left">{{ item.title }}</span>
                </button>
                <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5" @click="toggleGroup(item.path)">
                  <ChevronDown :size="15" :class="openGroups[item.path] ? 'rotate-180' : ''" />
                </button>
              </div>
              <div v-if="openGroups[item.path] && isExpanded" class="ml-5 border-l border-gray-200 pl-3 dark:border-gray-800">
                <NuxtLink v-for="child in item.children" :key="child.path" :to="child.path" :class="['mb-1 flex items-center rounded-lg px-3 py-2 text-sm transition', isItemActive(child.path) ? 'bg-brand-50 font-medium text-brand-500' : 'text-gray-600 dark:text-gray-400']" @click="closeMobile">{{ child.title }}</NuxtLink>
              </div>
            </div>
          </template>
        </div>
        <div v-if="isExpanded" class="mt-6 mb-5 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-3 dark:border-gray-800 dark:bg-white/[0.03]" :style="groupColor ? { borderLeftColor: groupColor, borderLeftWidth: '3px' } : undefined">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400"><Building2 :size="10" /><span>Çalışma Alanı</span></div>
              <p class="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ activeWorkspaceLabel || groupName || tenantName }}</p>
            </div>
            <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-2 py-1 text-[9px] font-semibold text-success-600"><span class="h-1.5 w-1.5 rounded-full bg-success-500"></span>Aktif</span>
          </div>
        </div>
        <div class="mt-auto border-t border-gray-100 pt-4 dark:border-gray-800">
          <div :class="['flex items-center gap-3 rounded-lg px-2 py-3', isExpanded ? 'justify-start' : 'justify-center']">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500">{{ initials }}</div>
            <div v-if="isExpanded" class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ displayUser?.name || 'Kullanıcı' }}</p>
              <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ roleLabel }}</p>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  </div>
</template>
<script setup lang="ts">
import { Building2, ChevronDown, FileText, Flame, FolderTree, Home, LayoutGrid, MapPin, Settings, ShieldCheck, Users } from '@lucide/vue'
import { workspaceThemeApi, type WorkspaceTheme } from '~/api/workspace-theme'
import { useWorkspaceContextStore } from '~/stores/workspaceContext'

type MenuItem = { title: string; path: string; icon: unknown; children?: MenuItem[]; to?: string }

const route = useRoute()
const tenantStore = useTenantStore()
const { isExpanded, isMobileOpen, closeMobile } = useTailAdminSidebar()
const auth = useAuth()
const openGroups = reactive<Record<string, boolean>>({ organization: true })

const tenantId = computed(() => {
  const value = route.params.tenantId
  return Array.isArray(value) ? value[0] : value
})
const basePath = computed(() => `/tenants/${tenantId.value}`)
const currentTenant = computed(() => tenantStore.currentTenant)
const tenantName = computed(() => currentTenant.value?.name ?? 'Yükleniyor...')
const rootOrganization = computed(() => currentTenant.value?.root_organization ?? null)

const workspaceContext = useWorkspaceContextStore()
const { organizations, selectedOrganizationId, isLocationExpertOnly, operationalAreas, selectedOperationalAreaId } = storeToRefs(workspaceContext)

// "Çalışma Alanı" kutusu artık header'daki context selector'ının aktif
// seçimini yansıtır (statik grup adı değil) — kullanıcı organizasyon
// değiştirdiğinde burası da güncellenir.
const activeWorkspaceLabel = computed(() => {
  if (isLocationExpertOnly.value) {
    return operationalAreas.value.items.find(item => item.id === selectedOperationalAreaId.value)?.name ?? null
  }
  return organizations.value.find(item => item.id === selectedOrganizationId.value)?.name ?? null
})

const workspaceTheme = ref<WorkspaceTheme | null>(null)
watch(tenantId, async id => {
  if (!id) { workspaceTheme.value = null; return }
  try {
    const response = await workspaceThemeApi.get()
    workspaceTheme.value = response.data
  } catch {
    workspaceTheme.value = null
  }
}, { immediate: true })
const groupColor = computed(() => workspaceTheme.value?.organization?.color ?? null)
const groupName = computed(() => workspaceTheme.value?.organization?.name ?? null)
const groupBrandLogo = computed(() => workspaceTheme.value?.organization?.default_brand?.logo_url ?? workspaceTheme.value?.featured_brand?.logo_url ?? null)

const displayUser = computed(() => auth.user.value)
const roleLabel = computed(() => (groupName.value ? 'Grup Yöneticisi' : 'Tenant Yöneticisi'))
const initials = computed(() => {
  const name = displayUser.value?.name?.trim() || 'K'
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR')
})

const menuItems = computed<MenuItem[]>(() => {
  const id = tenantId.value
  if (!id) return []
  const base = basePath.value
  const organizationPath = `${base}/organization`
  const authorizationPath = `${base}/authorization`
  const items: MenuItem[] = [{ title: 'Genel Durum', path: base, icon: Home }]

  if (rootOrganization.value?.type === 'holding') {
    items.push({ title: 'Organizasyon', path: 'organization', icon: Building2, children: [
      { title: 'Gruplar', path: `${organizationPath}/groups`, icon: FolderTree },
      { title: 'Şirketler', path: `${organizationPath}/companies`, icon: Building2 },
      { title: 'Markalar', path: `${organizationPath}/brands`, icon: LayoutGrid },
      { title: 'Hiyerarşi Görünümü', path: `${organizationPath}/hierarchy`, icon: FolderTree },
    ] })
  } else if (rootOrganization.value?.type === 'group') {
    items.push({ title: 'Organizasyon', path: 'organization', icon: Building2, children: [
      { title: 'Şirketler', path: `${organizationPath}/companies`, icon: Building2 },
      { title: 'Markalar', path: `${organizationPath}/brands`, icon: LayoutGrid },
      { title: 'Hiyerarşi Görünümü', path: `${organizationPath}/hierarchy`, icon: FolderTree },
    ] })
  } else if (rootOrganization.value?.type === 'company') {
    items.push({ title: 'Organizasyon', path: 'organization', icon: Building2, children: [
      { title: 'Markalar', path: `${organizationPath}/brands`, icon: LayoutGrid },
    ] })
  }

  items.push(
    { title: 'Lokasyonlar', path: `${base}/locations`, icon: MapPin },
    { title: 'Alt Yükleniciler', path: `${base}/contractors`, icon: Users },
    { title: 'Evrak Yönetimi', path: 'documents', icon: FileText, children: [
      { title: 'Faaliyetler', path: `${base}/documents/activities`, icon: FileText },
    ] },
    { title: 'Yangın Modülü', path: 'fire-safety', icon: Flame, to: `${base}/fire-safety/dashboard`, children: [
      { title: 'Dashboard', path: `${base}/fire-safety/dashboard`, icon: LayoutGrid },
      { title: 'Ekipman Türleri', path: `${base}/fire-safety/equipment-types`, icon: Flame },
    ] },
    { title: 'Yetkilendirme', path: 'authorization', icon: ShieldCheck, children: [
      { title: 'Kullanıcılar', path: `${authorizationPath}/users`, icon: Users },
      { title: 'Roller ve Yetkiler', path: `${authorizationPath}/roles-permissions`, icon: ShieldCheck },
    ] },
    { title: 'Raporlar', path: `${base}/reports`, icon: FileText },
    { title: 'Ayarlar', path: `${base}/settings`, icon: Settings },
  )

  return items
})

const toggleGroup = (key: string) => { openGroups[key] = !openGroups[key] }

const flattenedPaths = computed(() => menuItems.value.flatMap(item => item.children ? item.children.map(child => child.path) : [item.path]))
const activePath = computed(() => {
  const paths = flattenedPaths.value
  const exact = paths.find(p => p === route.path)
  if (exact) return exact
  const prefixMatches = paths.filter(p => route.path.startsWith(`${p}/`))
  if (!prefixMatches.length) return null
  return prefixMatches.reduce((longest, p) => (p.length > longest.length ? p : longest))
})
const isItemActive = (path: string) => path === activePath.value
</script>
