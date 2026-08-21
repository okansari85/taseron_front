<template>
  <div>
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 z-[9998] bg-black/30 lg:hidden"
      @click="closeMobile"
    ></div>

    <aside
      :class="[
        'fixed left-0 top-0 z-[9999] flex h-screen flex-col border-r border-gray-200 bg-white px-5 transition-all duration-300 dark:border-gray-800 dark:bg-gray-900',
        isExpanded ? 'w-[290px]' : 'w-[90px]',
        isMobileOpen ? 'w-[290px] translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <div :class="['flex py-8', isExpanded ? 'justify-start' : 'justify-center']">
        <NuxtLink to="/tenants" class="flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            T
          </span>

          <span
            v-if="isExpanded"
            class="text-lg font-semibold text-gray-800 dark:text-white/90"
          >
            Taseron
          </span>
        </NuxtLink>
      </div>

      <nav class="no-scrollbar flex flex-1 flex-col overflow-y-auto pb-6">
        <div>
          <p
            v-if="isExpanded"
            class="mb-4 text-xs font-medium uppercase tracking-wide text-gray-400"
          >
            Menü
          </p>

          <div class="flex flex-col gap-2">
            <NuxtLink
              v-for="item in items"
              :key="item.path"
              :to="item.path"
              :class="[
                'menu-item group',
                isActive(item.path)
                  ? 'menu-item-active'
                  : 'menu-item-inactive',
                isExpanded ? 'justify-start' : 'justify-center',
              ]"
              @click="closeMobile"
            >
              <component :is="item.icon" :size="18" />

              <span v-if="isExpanded" class="truncate">
                {{ item.title }}
              </span>
            </NuxtLink>
          </div>
        </div>

        <div
          v-if="isTenantWorkspace"
          class="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800"
        >
          <p
            v-if="isExpanded"
            class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400"
          >
            Workspace
          </p>

          <div
            v-if="isExpanded"
            class="mb-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Aktif Workspace
                </p>

                <p class="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                  {{ tenantName }}
                </p>
              </div>

              <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-2 py-1 text-[10px] font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-400">
                <span class="h-1.5 w-1.5 rounded-full bg-success-500"></span>
                Aktif
              </span>
            </div>
          </div>

          <NuxtLink
            v-if="isExpanded"
            :to="`/tenants/${tenantId}/settings/workspace`"
            :class="[
              'mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition',
              isWorkspaceItemActive(`/tenants/${tenantId}/settings/workspace`)
                ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white/90',
            ]"
            @click="closeMobile"
          >
            <Settings :size="14" />
            <span>Workspace Ayarları</span>
          </NuxtLink>

          <div class="flex flex-col gap-1">
            <template
              v-for="item in workspaceItems"
              :key="item.path"
            >
              <NuxtLink
                v-if="!item.children"
                :to="item.path"
                :class="[
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isWorkspaceItemActive(item.path)
                    ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white/90',
                  isExpanded ? 'justify-start' : 'justify-center',
                ]"
                @click="closeMobile"
              >
                <component :is="item.icon" :size="17" />

                <span v-if="isExpanded" class="truncate">
                  {{ item.title }}
                </span>
              </NuxtLink>

              <div v-else>
                <div
                  :class="[
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300',
                    isExpanded ? 'justify-start' : 'justify-center',
                  ]"
                >
                  <component :is="item.icon" :size="17" />

                  <span v-if="isExpanded" class="flex-1 truncate">
                    {{ item.title }}
                  </span>

                  <ChevronDown
                    v-if="isExpanded"
                    :size="15"
                    class="rotate-180"
                  />
                </div>

                <div
                  v-if="isExpanded"
                  class="ml-5 border-l border-gray-200 pl-3 dark:border-gray-800"
                >
                  <NuxtLink
                    v-for="child in item.children"
                    :key="child.path"
                    :to="child.path"
                    :class="[
                      'mb-1 flex items-center rounded-lg px-3 py-2 text-sm transition',
                      isWorkspaceItemActive(child.path)
                        ? 'bg-brand-50 font-medium text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white/90',
                    ]"
                    @click="closeMobile"
                  >
                    {{ child.title }}
                  </NuxtLink>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="mt-auto border-t border-gray-100 pt-4 dark:border-gray-800">
          <div
            :class="[
              'flex items-center gap-3 rounded-lg px-2 py-3',
              isExpanded ? 'justify-start' : 'justify-center',
            ]"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              AY
            </div>

            <div v-if="isExpanded" class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                Ahmet Yılmaz
              </p>

              <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                Sistem Yöneticisi
              </p>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  </div>
</template>

<script setup lang="ts">
import {
  Building2,
  ChevronDown,
  FileText,
  FolderTree,
  Home,
  LayoutGrid,
  Settings,
  Users,
} from '@lucide/vue'

type WorkspaceMenuItem = {
  title: string
  path: string
  icon: unknown
  children?: WorkspaceMenuItem[]
}

const route = useRoute()
const tenantStore = useTenantStore()
const { isExpanded, isMobileOpen, closeMobile } = useTailAdminSidebar()

const items = [
  { title: 'Ana Sayfa', path: '/', icon: Home },
  { title: 'Tenantlar', path: '/tenants', icon: LayoutGrid },
]

const tenantId = computed(() => {
  const value = route.params.tenantId

  return Array.isArray(value) ? value[0] : value
})

const isTenantWorkspace = computed(() => Boolean(tenantId.value))
const currentTenant = computed(() => tenantStore.currentTenant)
const tenantName = computed(() => currentTenant.value?.name ?? 'Tenant yükleniyor...')
const rootOrganization = computed(() => currentTenant.value?.root_organization ?? null)

const workspaceItems = computed<WorkspaceMenuItem[]>(() => {
  const id = tenantId.value

  if (!id || !rootOrganization.value) {
    return []
  }

  const basePath = `/tenants/${id}`
  const organizationPath = `${basePath}/organization`

  const menuItems: WorkspaceMenuItem[] = [
    {
      title: 'Ana Sayfa',
      path: basePath,
      icon: Home,
    },
  ]

  if (rootOrganization.value.type === 'holding') {
    menuItems.push({
      title: 'Organizasyon',
      path: organizationPath,
      icon: Building2,
      children: [
        { title: 'Gruplar', path: `${organizationPath}/groups`, icon: FolderTree },
        { title: 'Şirketler', path: `${organizationPath}/companies`, icon: Building2 },
        { title: 'Markalar', path: `${organizationPath}/brands`, icon: LayoutGrid },
        { title: 'Lokasyonlar', path: `${organizationPath}/locations`, icon: LayoutGrid },
        { title: 'Hiyerarşi Görünümü', path: `${organizationPath}/hierarchy`, icon: FolderTree },
      ],
    })
  }

  if (rootOrganization.value.type === 'group') {
    menuItems.push({
      title: 'Organizasyon',
      path: organizationPath,
      icon: Building2,
      children: [
        { title: 'Şirketler', path: `${organizationPath}/companies`, icon: Building2 },
        { title: 'Markalar', path: `${organizationPath}/brands`, icon: LayoutGrid },
        { title: 'Lokasyonlar', path: `${organizationPath}/locations`, icon: LayoutGrid },
        { title: 'Hiyerarşi Görünümü', path: `${organizationPath}/hierarchy`, icon: FolderTree },
      ],
    })
  }

  if (rootOrganization.value.type === 'company') {
    menuItems.push({
      title: 'Organizasyon',
      path: organizationPath,
      icon: Building2,
      children: [
        { title: 'Markalar', path: `${organizationPath}/brands`, icon: LayoutGrid },
        { title: 'Lokasyonlar', path: `${organizationPath}/locations`, icon: LayoutGrid },
      ],
    })
  }

  menuItems.push(
    { title: 'Taşeronlar', path: `${basePath}/contractors`, icon: Users },
    { title: 'Kullanıcılar', path: `${basePath}/users`, icon: Users },
    { title: 'Raporlar', path: `${basePath}/reports`, icon: FileText },
    { title: 'Ayarlar', path: `${basePath}/settings`, icon: Settings },
  )

  return menuItems
})

watch(
  tenantId,
  async (id) => {
    if (!id) return

    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId <= 0) return
    if (tenantStore.currentTenant?.id === numericId) return

    await tenantStore.fetchTenant(numericId)
  },
  { immediate: true },
)

const isActive = (path: string) => {
  return route.path === path || (path !== '/' && route.path.startsWith(`${path}/`))
}

const isWorkspaceItemActive = (path: string) => {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>
