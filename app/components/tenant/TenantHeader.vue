<template>
  <header class="sticky top-0 z-[999] w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="flex w-full items-center justify-between px-4 py-3 lg:px-6 lg:py-3.5">
      <div class="flex min-w-0 items-center gap-3">
        <button class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300 lg:h-11 lg:w-11" @click="handleSidebar"><Menu :size="20" /></button>
        <div class="hidden min-w-0 sm:block">
          <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <template v-for="(item, index) in breadcrumbs" :key="`${item.kind}-${item.id}`"><button type="button" class="truncate transition hover:text-brand-500" :class="index === breadcrumbs.length - 1 ? 'font-medium text-gray-600 dark:text-gray-300' : ''" @click="handleBreadcrumb(item)">{{ item.name }}</button><span v-if="index < breadcrumbs.length - 1" class="text-gray-300 dark:text-gray-700">/</span></template>
          </div>
          <p class="truncate text-[10px] font-medium text-gray-400 dark:text-gray-500">Taseron Yönetim Sistemi</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <template v-if="workspaceContext.hasAccess">
          <OrganizationContextSelector />
          <LocationContextSelector />
          <OperationalAreaContextSelector v-if="workspaceContext.showOperationalAreaSelector" />
        </template>
        <!-- Organizasyon scope'u olmayıp location_experts üzerinden doğrudan
             bir/birkaç operasyonel alana atanmış kullanıcılar (İSG uzmanı gibi):
             Organizasyon combo'su hiç gösterilmez. Lokasyon, seçili operasyonel
             alana bağlı olarak otomatik gösterilir ama disabled'dır (seçilemez). -->
        <template v-else-if="workspaceContext.isLocationExpertOnly">
          <LocationContextSelector />
          <OperationalAreaContextSelector />
        </template>
        <button class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" title="Tema" @click="toggleTheme"><Sun v-if="isDark" :size="18" /><Moon v-else :size="18" /></button>
        <button class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" title="Bildirimler"><Bell :size="18" /></button>
        <div class="relative hidden sm:block">
          <button class="flex items-center gap-3 border-l border-gray-200 pl-3 text-left dark:border-gray-800" title="Profil menüsü" @click="profileOpen = !profileOpen">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">{{ initials }}</div>
            <div><p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ auth.user.value?.name || 'Kullanıcı' }}</p></div>
          </button>
          <div v-if="profileOpen" class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900"><button class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="handleLogout">Çıkış Yap</button></div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Bell, Menu, Moon, Sun } from '@lucide/vue'
import OrganizationContextSelector from '~/components/workspace/OrganizationContextSelector.vue'
import LocationContextSelector from '~/components/workspace/LocationContextSelector.vue'
import OperationalAreaContextSelector from '~/components/workspace/OperationalAreaContextSelector.vue'
import { useWorkspaceContextStore } from '~/stores/workspaceContext'
const route = useRoute()
const router = useRouter()
const { toggle, toggleMobile } = useTailAdminSidebar()
const { isDark, toggle: toggleTheme } = useTailAdminTheme()
const auth = useAuth()
const { breadcrumbs, goToBreadcrumb } = useOrganizationScope()
const workspaceContext = useWorkspaceContextStore()
const tenantId = computed(() => Array.isArray(route.params.tenantId) ? route.params.tenantId[0] : route.params.tenantId)
watch(tenantId, (id) => { if (!id) return; workspaceContext.reset(); workspaceContext.init(id) }, { immediate: true })
const profileOpen = ref(false)
const initials = computed(() => { const name = auth.user.value?.name?.trim() || 'K'; return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR') })
const handleSidebar = () => { if (import.meta.client && window.innerWidth < 1024) toggleMobile(); else toggle() }
const handleBreadcrumb = (item: (typeof breadcrumbs.value)[number]) => { goToBreadcrumb(item.kind) }
const handleLogout = async () => { profileOpen.value = false; await auth.logout(); await router.push('/login') }
</script>
