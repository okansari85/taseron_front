<template>
  <header class="sticky top-0 z-[999] flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="flex w-full items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
      <div class="flex items-center gap-3">
        <button
          class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300 lg:h-11 lg:w-11"
          @click="handleSidebar"
        >
          <Menu :size="20" />
        </button>

        <div class="hidden text-sm font-medium text-gray-500 sm:block dark:text-gray-400">
          Taseron Management
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div v-if="isTenantWorkspace" class="relative hidden md:block">
          <button
            class="flex min-w-[190px] items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
            title="Tenant değiştir"
            @click="tenantSelectorOpen = !tenantSelectorOpen"
          >
            <span class="flex min-w-0 items-center gap-2.5">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                <Building2 :size="15" />
              </span>

              <span class="min-w-0 truncate text-xs font-semibold text-gray-800 dark:text-white/90">
                {{ currentTenant?.name || 'Tenant seçin' }}
              </span>
            </span>

            <ChevronDown
              :size="15"
              class="shrink-0 text-gray-400 transition-transform"
              :class="tenantSelectorOpen ? 'rotate-180' : ''"
            />
          </button>

          <div
            v-if="tenantSelectorOpen"
            class="absolute right-0 top-full z-[1000] mt-2 w-64 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-gray-900"
          >
            <p class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Tenant Değiştir
            </p>

            <button
              v-for="tenant in tenantStore.tenants"
              :key="tenant.id"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
              :class="tenant.id === currentTenant?.id ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''"
              @click="selectTenant(tenant.id)"
            >
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                {{ tenant.name.charAt(0).toUpperCase() }}
              </span>

              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                  {{ tenant.name }}
                </span>
                <span class="block text-[10px] text-gray-400">
                  {{ tenant.status === 'active' ? 'Aktif' : 'Pasif' }}
                </span>
              </span>

              <span
                v-if="tenant.id === currentTenant?.id"
                class="h-1.5 w-1.5 rounded-full bg-success-500"
              ></span>
            </button>
          </div>
        </div>

        <button
          class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          title="Tema"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" :size="18" />
          <Moon v-else :size="18" />
        </button>

        <button
          class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          title="Bildirimler"
        >
          <Bell :size="18" />
        </button>

        <div class="relative hidden sm:block">
          <button
            class="flex items-center gap-3 border-l border-gray-200 pl-3 text-left dark:border-gray-800"
            title="Profil menüsü"
            @click="profileOpen = !profileOpen"
          >
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              {{ initials }}
            </div>

            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ auth.user.value?.name || 'Kullanıcı' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ roleLabel }}
              </p>
            </div>
          </button>

          <div
            v-if="profileOpen"
            class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <button
              class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              @click="handleLogout"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Bell, Building2, ChevronDown, Menu, Moon, Sun } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const { toggle, toggleMobile } = useTailAdminSidebar()
const { isDark, toggle: toggleTheme } = useTailAdminTheme()
const auth = useAuth()
const tenantStore = useTenantStore()

const profileOpen = ref(false)
const tenantSelectorOpen = ref(false)

const tenantId = computed(() => {
  const value = route.params.tenantId
  return Array.isArray(value) ? value[0] : value
})

const isTenantWorkspace = computed(() => Boolean(tenantId.value))
const currentTenant = computed(() => tenantStore.currentTenant)

const initials = computed(() => {
  const name = auth.user.value?.name?.trim() || 'K'
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR')
})

const roleLabel = computed(() => {
  const role = auth.user.value?.roles?.[0]
  const labels: Record<string, string> = {
    'super-admin': 'Sistem Yöneticisi',
    'tenant-admin': 'Tenant Yöneticisi',
  }
  return role ? labels[role] || role : 'Kullanıcı'
})

watch(
  isTenantWorkspace,
  async (enabled) => {
    if (!enabled || tenantStore.tenants.length > 0) return

    await tenantStore.fetchTenants()
  },
  { immediate: true },
)

const handleSidebar = () => {
  if (import.meta.client && window.innerWidth < 1024) toggleMobile()
  else toggle()
}

const selectTenant = async (id: number) => {
  tenantSelectorOpen.value = false

  if (id === currentTenant.value?.id) return

  await router.push(`/tenants/${id}`)
}

const handleLogout = async () => {
  profileOpen.value = false
  await auth.logout()
  await router.push('/login')
}
</script>
