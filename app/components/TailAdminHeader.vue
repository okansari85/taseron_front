<template>
  <header class="sticky top-0 z-[999] w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="flex w-full items-center justify-between px-4 py-3 lg:px-6 lg:py-3.5">
      <div class="flex min-w-0 items-center gap-3">
        <button class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300 lg:h-11 lg:w-11" @click="handleSidebar">
          <Menu :size="20" />
        </button>
        <div class="hidden min-w-0 sm:block">
          <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <template v-for="(item, index) in visibleBreadcrumbs" :key="`${item.kind}-${item.id}`">
              <button type="button" class="truncate transition hover:text-brand-500" :class="index === visibleBreadcrumbs.length - 1 ? 'font-medium text-gray-600 dark:text-gray-300' : ''" @click="goToBreadcrumb(item.kind)">
                {{ item.name }}
              </button>
              <span v-if="index < visibleBreadcrumbs.length - 1" class="text-gray-300 dark:text-gray-700">/</span>
            </template>
          </div>
          <p class="truncate text-[10px] font-medium text-gray-400 dark:text-gray-500">Taseron Management</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div v-if="isTenantWorkspace && allowedKinds.length" class="relative hidden lg:block">
          <button
            type="button"
            class="flex min-w-[230px] max-w-[320px] items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-brand-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40"
            :title="`Kapsam: ${currentScopeName}`"
            @click="scopeSelectorOpen = !scopeSelectorOpen"
          >
            <span class="flex min-w-0 items-center gap-2.5">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                <component :is="currentScopeIcon" :size="15" />
              </span>
              <span class="min-w-0">
                <span class="block text-[9px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ currentScopeLabel }}</span>
                <span class="block truncate text-xs font-semibold text-gray-800 dark:text-white/90">{{ currentScopeName }}</span>
              </span>
            </span>
            <ChevronDown :size="15" class="shrink-0 text-gray-400 transition-transform" :class="scopeSelectorOpen ? 'rotate-180' : ''" />
          </button>

          <div v-if="scopeSelectorOpen" class="absolute right-0 top-full z-[1000] mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div class="border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{{ moduleTitle }} kapsamı</p>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Bu sayfada veriyi hangi kapsamda görmek istediğini seç.</p>
            </div>

            <label class="mx-1.5 mt-1.5 flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-100 px-3 py-2.5 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
              <input v-model="showPreviousScope" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" />
              <span class="min-w-0 flex-1">
                <span class="block text-xs font-semibold text-gray-700 dark:text-gray-200">Önceki kapsamı göster</span>
                <span class="block text-[10px] text-gray-400">Kapatırsan breadcrumb yalnızca mevcut kapsamı gösterir.</span>
              </span>
            </label>

            <div v-if="allowedKinds.length > 1" class="flex gap-1 p-2">
              <button
                v-for="kind in allowedKinds"
                :key="kind"
                type="button"
                class="flex-1 rounded-lg px-2 py-2 text-[10px] font-semibold transition"
                :class="selectedKind === kind ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'"
                @click="selectedKind = kind"
              >
                {{ scopeKindLabel(kind) }}
              </button>
            </div>

            <div class="max-h-72 overflow-y-auto px-1.5 pb-1.5">
              <button
                v-for="option in selectorOptions"
                :key="option.id"
                type="button"
                class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
                :class="isOptionSelected(option) ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''"
                @click="selectOption(option)"
              >
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  <component :is="option.icon" :size="13" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{{ option.name }}</span>
                  <span class="block text-[10px] text-gray-400">{{ option.description }}</span>
                </span>
                <Check v-if="isOptionSelected(option)" :size="14" class="shrink-0 text-brand-500" />
              </button>
              <div v-if="!selectorOptions.length" class="px-3 py-5 text-center text-xs text-gray-400">Bu kapsam için seçim bulunamadı.</div>
            </div>
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
import { Bell, Check, ChevronDown, Menu, Moon, Sun } from '@lucide/vue'
import type { Component } from 'vue'

type ScopeKind = 'tenant' | 'group' | 'company' | 'brand' | 'location'
type ScopeOption = { id: string | number; name: string; description: string; icon: Component }

const route = useRoute()
const router = useRouter()
const { toggle, toggleMobile } = useTailAdminSidebar()
const { isDark, toggle: toggleTheme } = useTailAdminTheme()
const auth = useAuth()
const tenantStore = useTenantStore()
const { moduleKey, allowedKinds, currentScope, currentTenant, scopeKindLabel, scopeIcon, optionsForKind, setScope, breadcrumbs, goToBreadcrumb } = useOrganizationScope()

const profileOpen = ref(false)
const scopeSelectorOpen = ref(false)
const selectedKind = ref<ScopeKind>('group')
const showPreviousScope = useState<boolean>('organization-show-previous-scope', () => true)

const tenantId = computed(() => {
  const value = route.params.tenantId
  return Array.isArray(value) ? value[0] : value
})
const isTenantWorkspace = computed(() => Boolean(tenantId.value))
const currentScopeName = computed(() => currentScope.value?.name || 'Kapsam seçin')
const currentScopeLabel = computed(() => currentScope.value ? scopeKindLabel(currentScopeKind.value) : 'Kapsam')
const currentScopeIcon = computed(() => scopeIcon(currentScopeKind.value))
const currentScopeKind = computed<ScopeKind>(() => currentScope.value ? (currentScope.value.id === currentTenant.value?.id ? 'tenant' : selectedKind.value) : selectedKind.value)
const moduleTitle = computed(() => ({ dashboard: 'Genel Bakış', groups: 'Gruplar', companies: 'Şirketler', brands: 'Markalar', locations: 'Lokasyonlar', hierarchy: 'Hiyerarşi' }[moduleKey.value]))
const selectorOptions = computed<ScopeOption[]>(() => optionsForKind(selectedKind.value) as ScopeOption[])
const visibleBreadcrumbs = computed(() => {
  if (!breadcrumbs.value.length) return []
  if (showPreviousScope.value) return breadcrumbs.value.slice(-2)
  return breadcrumbs.value.slice(-1)
})

const isOptionSelected = (option: ScopeOption) => currentScope.value?.id === option.id && currentScopeKind.value === selectedKind.value

const selectOption = (option: ScopeOption) => {
  setScope(selectedKind.value, option)
  scopeSelectorOpen.value = false
}

watch(allowedKinds, (kinds) => {
  if (!kinds.length) return
  if (!kinds.includes(selectedKind.value)) selectedKind.value = kinds[0]
}, { immediate: true })

watch(moduleKey, () => { scopeSelectorOpen.value = false })

watch(isTenantWorkspace, async (enabled) => {
  if (!enabled || tenantStore.tenants.length > 0) return
  await tenantStore.fetchTenants()
}, { immediate: true })

const initials = computed(() => {
  const name = auth.user.value?.name?.trim() || 'K'
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR')
})

const roleLabel = computed(() => {
  const role = auth.user.value?.roles?.[0]
  const labels: Record<string, string> = { 'super-admin': 'Sistem Yöneticisi', 'tenant-admin': 'Tenant Yöneticisi' }
  return role ? labels[role] || role : 'Kullanıcı'
})

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
