<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'
defineProps<{ locations: Array<{ name: string; business: string; status: string }> }>()
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs"><div class="mb-5"><h2 class="text-sm font-semibold text-gray-900">Lokasyonlar</h2><p class="mt-1 text-xs text-gray-500">Daimi alt yüklenicinin lokasyon bazındaki ilişkileri.</p></div><div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><div v-for="item in locations" :key="item.name" class="rounded-xl border border-gray-100 p-5"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-medium text-gray-800">{{ item.name }}</p><p class="mt-1 text-xs text-gray-500">{{ item.business }}</p></div><MapPin :size="17" class="text-gray-400"/></div><span class="mt-4 inline-block rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-medium text-success-600">{{ item.status }}</span></div></div></section>
</template>