<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

defineProps<{ total: number; totalPages: number; visiblePages: number[] }>()
const currentPage = defineModel<number>('page', { default: 1 })
const perPage = defineModel<number>('perPage', { default: 10 })
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
    <span class="text-sm text-gray-500 dark:text-gray-400">Toplam {{ total }} kayıt</span>
    <div class="flex items-center justify-center gap-1">
      <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft :size="16" /></button>
      <button v-for="page in visiblePages" :key="page" type="button" class="h-9 min-w-9 rounded-lg px-2 text-sm font-medium" :class="page === currentPage ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]'" @click="currentPage = page">{{ page }}</button>
      <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight :size="16" /></button>
    </div>
    <select v-model.number="perPage" class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"><option :value="10">10 / sayfa</option><option :value="25">25 / sayfa</option><option :value="50">50 / sayfa</option></select>
  </div>
</template>
