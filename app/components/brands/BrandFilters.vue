<script setup lang="ts">
import { ChevronDown, Filter, Search } from 'lucide-vue-next'

defineProps<{ companies: string[]; groups: string[] }>()

const search = defineModel<string>('search', { default: '' })
const company = defineModel<string>('company', { default: 'all' })
const group = defineModel<string>('group', { default: 'all' })
const status = defineModel<string>('status', { default: 'all' })
const emit = defineEmits<{ reset: [] }>()
</script>

<template>
  <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-[minmax(180px,1.1fr)_1fr_1fr_1fr_auto] md:items-end">
      <label>
        <span class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Marka</span>
        <div class="relative">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="search" type="search" placeholder="Marka ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </div>
      </label>
      <label>
        <span class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Şirket</span>
        <div class="relative">
          <select v-model="company" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="all">Tümü</option>
            <option v-for="item in companies" :key="item" :value="item">{{ item }}</option>
          </select>
          <ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </label>
      <label>
        <span class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Grup</span>
        <div class="relative">
          <select v-model="group" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="all">Tümü</option>
            <option v-for="item in groups" :key="item" :value="item">{{ item }}</option>
          </select>
          <ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </label>
      <label>
        <span class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Durum</span>
        <div class="relative">
          <select v-model="status" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="all">Tümü</option><option value="active">Aktif</option><option value="passive">Pasif</option>
          </select>
          <ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </label>
      <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400" @click="emit('reset')">
        <Filter :size="15" />Filtreleri Temizle
      </button>
    </div>
  </section>
</template>
