<template>
  <header class="sticky top-0 z-[999] w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="flex w-full items-center justify-between px-4 py-3 lg:px-6 lg:py-3.5">
      <div class="flex min-w-0 items-center gap-3">
        <button class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300 lg:h-11 lg:w-11" @click="handleSidebar"><Menu :size="20" /></button>
        <div class="hidden min-w-0 sm:block">
          <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <template v-for="(item, index) in displayBreadcrumbs" :key="`${item.kind}-${item.id}`">
              <button type="button" class="truncate transition hover:text-brand-500" :class="index === displayBreadcrumbs.length - 1 ? 'font-medium text-gray-600 dark:text-gray-300' : ''" @click="handleBreadcrumb(item)">{{ item.name }}</button>
              <span v-if="index < displayBreadcrumbs.length - 1" class="text-gray-300 dark:text-gray-700">/</span>
            </template>
          </div>
          <p class="truncate text-[10px] font-medium text-gray-400 dark:text-gray-500">Taseron Management</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div v-if="isTenantWorkspace && currentTenantOption" class="relative hidden lg:block">
          <button type="button" class="flex min-w-[230px] max-w-[320px] items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-brand-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40" @click="tenantSelectorOpen = !tenantSelectorOpen">
            <span class="flex min-w-0 items-center gap-2.5">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><component :is="currentTenantOption.icon" :size="15" /></span>
              <span class="min-w-0"><span class="block text-[9px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Tenant</span><span class="block truncate text-xs font-semibold text-gray-800 dark:text-white/90">{{ currentTenantOption.name }}</span></span>
            </span>
            <ChevronDown :size="15" class="shrink-0 text-gray-400" />
          </button>
          <div v-if="tenantSelectorOpen" class="absolute right-0 top-full z-[1000] mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div class="border-b border-gray-100 px-3 py-2.5 dark:border-gray-800"><p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Tenant</p><p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Çalışma alanını seç.</p></div>
            <div class="max-h-72 overflow-y-auto p-1.5">
              <button v-for="item in tenantOptions" :key="item.id" type="button" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5" :class="Number(item.id) === Number(tenantId) ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''" @click="selectTenant(item.id)">
                <span class="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><Building2 :size="13" /></span>
                <span class="min-w-0 flex-1"><span class="block truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{{ item.name }}</span><span class="block text-[10px] text-gray-400">{{ Number(item.id) === Number(tenantId) ? 'Aktif tenant' : 'Tenant' }}</span></span>
                <Check v-if="Number(item.id) === Number(tenantId)" :size="14" class="text-brand-500" />
              </button>
              <p v-if="tenantOptions.length === 0" class="px-3 py-4 text-center text-xs text-gray-400">Tenant bulunamadı.</p>
            </div>
          </div>
        </div>

        <button class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" title="Tema" @click="toggleTheme"><Sun v-if="isDark" :size="18" /><Moon v-else :size="18" /></button>
        <button class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" title="Bildirimler"><Bell :size="18" /></button>
        <div class="relative hidden sm:block">
          <button class="flex items-center gap-3 border-l border-gray-200 pl-3 text-left dark:border-gray-800" title="Profil menüsü" @click="profileOpen = !profileOpen"><div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">{{ initials }}</div><div><p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ auth.user.value?.name || 'Kullanıcı' }}</p><p class="text-xs text-gray-500 dark:text-gray-400">{{ roleLabel }}</p></div></button>
          <div v-if="profileOpen" class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900"><button class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="handleLogout">Çıkış Yap</button></div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Bell, Building2, Check, ChevronDown, Menu, Moon, Sun } from '@lucide/vue'
const route = useRoute()
const router = useRouter()
const { toggle, toggleMobile } = useTailAdminSidebar()
const { isDark, toggle: toggleTheme } = useTailAdminTheme()
const auth = useAuth()
const tenantStore = useTenantStore()
const { currentTenantOption, tenantLocationContext, breadcrumbs, goToBreadcrumb } = useOrganizationScope()
const profileOpen = ref(false)
const tenantSelectorOpen = ref(false)
const tenantId = computed(() => Array.isArray(route.params.tenantId) ? route.params.tenantId[0] : route.params.tenantId)
const isTenantWorkspace = computed(() => Boolean(tenantId.value))
const tenantOptions = computed(() => tenantStore.tenants)
const displayBreadcrumbs = computed(() => {
  if (route.path.includes('/locations/') && tenantLocationContext.value) {
    return [
      ...(currentTenantOption.value ? [{ kind: 'tenant' as const, id: currentTenantOption.value.id, name: currentTenantOption.value.name }] : []),
      { kind: 'locations' as const, id: 'locations', name: 'Lokasyonlar' },
      { kind: 'location' as const, id: tenantLocationContext.value.id, name: tenantLocationContext.value.name },
    ]
  }
  return breadcrumbs.value
})
watch(isTenantWorkspace, async (enabled) => { if (enabled && tenantStore.tenants.length === 0) await tenantStore.fetchTenants() }, { immediate: true })
const selectTenant = async (id: number | string) => {
  tenantSelectorOpen.value = false
  await router.push(`/tenants/${id}${route.path.split(`/tenants/${tenantId.value}`).slice(1).join(`/tenants/${tenantId.value}`) || ''}`)
}
const initials = computed(() => { const name = auth.user.value?.name?.trim() || 'K'; return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR') })
const roleLabel = computed(() => { const role = auth.user.value?.roles?.[0]; const labels: Record<string, string> = { 'super-admin': 'Sistem Yöneticisi', 'tenant-admin': 'Tenant Yöneticisi' }; return role ? labels[role] || role : 'Kullanıcı' })
const handleSidebar = () => { if (import.meta.client && window.innerWidth < 1024) toggleMobile(); else toggle() }
const handleBreadcrumb = (item: (typeof displayBreadcrumbs.value)[number]) => { if (item.kind === 'locations') router.push(`/tenants/${tenantId.value}/locations`); else goToBreadcrumb(item.kind) }
const handleLogout = async () => { profileOpen.value = false; await auth.logout(); await router.push('/login') }
</script>
