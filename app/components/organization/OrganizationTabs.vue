<script setup lang="ts">
type TabItem = {
  label: string
  path?: string
  key?: string
}

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))

const props = withDefaults(defineProps<{
  tabs?: TabItem[]
  modelValue?: string
  basePath?: string
}>(), {
  tabs: () => [
    { label: 'Gruplar', path: 'groups' },
    { label: 'Şirketler', path: 'companies' },
    { label: 'Markalar', path: 'brands' },
    { label: 'Hiyerarşi Görünümü', path: 'hierarchy' },
  ],
  modelValue: '',
  basePath: 'organization',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isActive = (tab: TabItem) => {
  if (tab.path) return route.path.includes(`/tenants/${tenantId.value}/${props.basePath}/${tab.path}`)
  return props.modelValue === tab.key
}

const selectTab = (tab: TabItem) => {
  if (tab.key) emit('update:modelValue', tab.key)
}
</script>

<template>
  <nav class="mb-5 flex overflow-x-auto rounded-xl border border-gray-200 bg-white px-2 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]" aria-label="Sayfa menüsü">
    <template v-for="tab in tabs" :key="tab.key || tab.path">
      <NuxtLink
        v-if="tab.path"
        :to="`/tenants/${tenantId}/${props.basePath}/${tab.path}`"
        class="relative flex h-11 shrink-0 items-center px-4 font-medium transition"
        :class="isActive(tab)
          ? 'text-brand-500'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white/90'"
      >
        {{ tab.label }}
        <span v-if="isActive(tab)" class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-500" />
      </NuxtLink>

      <button
        v-else
        type="button"
        class="relative flex h-11 shrink-0 items-center px-4 font-medium transition"
        :class="isActive(tab)
          ? 'text-brand-500'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white/90'"
        @click="selectTab(tab)"
      >
        {{ tab.label }}
        <span v-if="isActive(tab)" class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-500" />
      </button>
    </template>
  </nav>
</template>
