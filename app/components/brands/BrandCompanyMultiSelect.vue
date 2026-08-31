<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next'
import type { Company } from '~/types/company'

const props = withDefaults(defineProps<{
  modelValue: number[]
  companies: Company[]
  placeholder?: string
}>(), { placeholder: 'Şirket seçiniz' })

const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

const selectedCompanies = computed(() => props.companies.filter(company => props.modelValue.includes(company.id)))
const selectedGroupId = computed(() => selectedCompanies.value[0]?.groupId ?? null)
const availableCompanies = computed(() => {
  if (selectedGroupId.value === null) return props.companies
  return props.companies.filter(company => company.groupId === selectedGroupId.value)
})
const label = computed(() => {
  if (!selectedCompanies.value.length) return props.placeholder
  if (selectedCompanies.value.length === 1) return selectedCompanies.value[0].name
  return `${selectedCompanies.value.length} şirket seçildi`
})

const toggle = (id: number) => {
  const next = props.modelValue.includes(id)
    ? props.modelValue.filter(item => item !== id)
    : [...props.modelValue, id]
  emit('update:modelValue', next)
}

const closeOnOutside = (event: MouseEvent) => {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutside))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutside))
</script>

<template>
  <div ref="root" class="relative">
    <button type="button" class="flex h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-left text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" @click="open = !open">
      <span :class="selectedCompanies.length ? '' : 'text-gray-400'">{{ label }}</span>
      <ChevronDown :size="16" class="shrink-0 text-gray-400" />
    </button>
    <div v-if="open" class="absolute left-0 right-0 top-full z-[10060] mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <button v-for="company in availableCompanies" :key="company.id" type="button" class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="toggle(company.id)">
        <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border" :class="modelValue.includes(company.id) ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 dark:border-gray-600'">
          <Check v-if="modelValue.includes(company.id)" :size="12" />
        </span>
        <span class="min-w-0 flex-1">{{ company.name }}</span>
      </button>
      <div v-if="availableCompanies.length === 0" class="px-3 py-3 text-sm text-gray-500">Uygun şirket bulunamadı.</div>
    </div>
  </div>
</template>
