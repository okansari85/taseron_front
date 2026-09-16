<script setup lang="ts">
import { FileText, FlameKindling } from '@lucide/vue'
import { useWorkspaceTheme } from '~/composables/useWorkspaceTheme'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const auth = useAuth()
const { color, load } = useWorkspaceTheme()

const tenantId = computed(() => Number(auth.user.value?.tenant_id ?? 0) || null)
onMounted(() => load(tenantId.value))
watch(tenantId, value => load(value))

const primary = computed(() => color.value || '#d71920')
const tabs = [
  { label: 'Tesisat Durumu', path: '/isg-portal/desktop/fire-suppression/inventory', icon: FlameKindling },
  { label: 'Raporlar', path: '/isg-portal/desktop/fire-suppression/reports', icon: FileText },
]
const active = (path: string) => route.path === path || route.path.startsWith(`${path}/`)
</script>

<template>
  <nav class="mb-5 flex flex-wrap items-center gap-1 rounded-xl border border-[#e7e9ed] bg-white p-1.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] dark:border-gray-800 dark:bg-gray-900">
    <NuxtLink
      v-for="item in tabs"
      :key="item.path"
      :to="item.path"
      class="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition"
      :class="active(item.path) ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'"
      :style="active(item.path) ? { backgroundColor: primary } : undefined"
    >
      <component :is="item.icon" :size="16" />
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
