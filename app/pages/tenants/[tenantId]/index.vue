<script setup lang="ts">
import { Building2, ChevronRight, FolderTree } from '@lucide/vue'

const route = useRoute()
const tenantStore = useTenantStore()

const tenantId = computed(() => {
  const value = route.params.tenantId
  return Number(Array.isArray(value) ? value[0] : value)
})

const tenant = computed(() => tenantStore.currentTenant)
const rootOrganization = computed(() => tenant.value?.root_organization ?? null)
</script>

<template>
  <div class="space-y-6 mx-auto w-full max-w-[1400px]">
    <div>
      <div class="mb-3 flex items-center gap-2 text-sm text-gray-400">
        <NuxtLink to="/tenants" class="transition hover:text-gray-700">Tenantlar</NuxtLink>
        <ChevronRight :size="15" />
        <span class="text-gray-600">{{ tenant?.name ?? 'Tenant' }}</span>
      </div>

      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white/90">{{ tenant?.name ?? 'Tenant Workspace' }}</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Tenant çalışma alanına hoş geldiniz.</p>
    </div>

    <div v-if="rootOrganization" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-start gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><Building2 :size="20" /></div>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Kök Organizasyon</p>
          <h2 class="mt-1 text-lg font-semibold text-gray-900 dark:text-white/90">{{ rootOrganization.name }}</h2>
          <div class="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><FolderTree :size="15" />{{ rootOrganization.type }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
