<script setup lang="ts">
import { UserRound } from 'lucide-vue-next'
type Visit = { date: string; location: string; business: string; purpose: string; people: number; status: string; personnel?: string[]; vehicles?: string[]; equipment?: string[]; chemicals?: string[] }
const props = defineProps<{ visits: Visit[] }>()
</script>
<template>
<div><div class="mb-6"><h2 class="text-sm font-semibold text-gray-900">Personel Ziyaret Geçmişi</h2><p class="mt-1 text-xs text-gray-500">Bu taşeron firma üzerinden sahaya gelen personeller ve ziyaret geçmişleri.</p></div><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><div v-for="person in [...new Set(props.visits.flatMap(v=>Array.from({length:v.people},(_,i)=>`Personel ${i+1}`)))]" :key="person" class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><div class="flex items-center gap-3"><div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600"><UserRound :size="16"/></div><div><p class="text-sm font-semibold text-gray-800">{{ person }}</p><p class="text-[11px] text-gray-500">Ziyaret geçmişi</p></div></div><div class="mt-4 flex items-center justify-between text-xs"><span class="text-gray-500">Toplam ziyaret</span><span class="font-semibold text-gray-800">{{ props.visits.length }}</span></div></div></div></div>
</template>