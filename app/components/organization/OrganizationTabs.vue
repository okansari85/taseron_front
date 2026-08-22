<script setup lang="ts">
const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))

const tabs = [
  { label: 'Gruplar', path: 'groups' },
  { label: 'Şirketler', path: 'companies' },
  { label: 'Markalar', path: 'brands' },
  { label: 'Hiyerarşi Görünümü', path: 'hierarchy' },
]

const isActive = (path: string) => route.path.includes(`/organization/${path}`)
</script>

<template>
  <nav class="mb-5 flex overflow-x-auto rounded-xl border border-gray-200 bg-white px-2 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]" aria-label="Organizasyon menüsü">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.path"
      :to="`/tenants/${tenantId}/organization/${tab.path}`"
      class="relative flex h-11 shrink-0 items-center px-4 font-medium transition"
      :class="isActive(tab.path)
        ? 'text-brand-500'
        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white/90'"
    >
      {{ tab.label }}
      <span
        v-if="isActive(tab.path)"
        class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-500"
      />
    </NuxtLink>
  </nav>
</template>
