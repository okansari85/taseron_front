<script setup lang="ts">
import { CalendarDays, CheckCircle2, Clock3, Plus, Search, ShieldCheck } from '@lucide/vue'
import { workRequests } from '~/data/operations'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId))
const q = ref('')
const filtered = computed(() => workRequests.filter(x => `${x.id} ${x.title} ${x.contractor} ${x.location}`.toLowerCase().includes(q.value.toLowerCase())))
const statusClass = (status: string) => ({
  'Taşeron Onayı Bekliyor': 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
  Onaylandı: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400',
  'Barkod Hazır': 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400',
  Planlandı: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300',
}[status] || 'bg-gray-100 text-gray-700')
</script>

<template>
  <div class="mx-auto w-full max-w-[1400px] space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 class="text-2xl font-semibold text-gray-900 dark:text-white/90">İş Talepleri</h1><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Lokasyon bazlı iş talebi, planlama ve taşeron onaylarını yönetin.</p></div>
      <NuxtLink :to="`/tenants/${tenantId}/work-requests/new`" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"><Plus :size="17" /> Yeni İş Talebi</NuxtLink>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div v-for="card in [{label:'Açık Talepler',value:'12',icon:Clock3},{label:'Taşeron Onayı',value:'4',icon:ShieldCheck},{label:'Bugün Planlanan',value:'7',icon:CalendarDays},{label:'Girişe Hazır',value:'5',icon:CheckCircle2}]" :key="card.label" class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><div class="flex items-center justify-between"><span class="text-sm text-gray-500">{{ card.label }}</span><component :is="card.icon" :size="18" class="text-brand-500" /></div><div class="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{{ card.value }}</div></div>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-100 p-4 dark:border-gray-800"><div class="relative max-w-md"><Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="17" /><input v-model="q" class="h-10 w-full rounded-xl border border-gray-200 bg-transparent pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700" placeholder="Talep, taşeron veya lokasyon ara..." /></div></div>
      <div class="overflow-x-auto"><table class="w-full min-w-[1000px] text-left text-sm"><thead><tr class="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800"><th class="px-5 py-4">Talep</th><th>Lokasyon / İşyeri</th><th>Taşeron</th><th>Planlama</th><th>Atamalar</th><th>Durum</th></tr></thead><tbody><tr v-for="item in filtered" :key="item.id" class="border-b border-gray-100 last:border-0 dark:border-gray-800"><td class="px-5 py-4"><NuxtLink :to="`/tenants/${tenantId}/work-requests/${item.id}`" class="font-medium text-gray-900 hover:text-brand-500 dark:text-white">{{ item.title }}</NuxtLink><div class="mt-1 text-xs text-gray-400">{{ item.id }} · {{ item.requester }}</div></td><td><div class="text-gray-700 dark:text-gray-300">{{ item.location }}</div><div class="text-xs text-gray-400">{{ item.lbe }}</div></td><td class="text-gray-700 dark:text-gray-300">{{ item.contractor }}</td><td><div>{{ item.date }}</div><div class="text-xs text-gray-400">{{ item.time }}</div></td><td class="text-xs text-gray-500">{{ item.people }} personel · {{ item.vehicles }} araç · {{ item.chemicals }} kimyasal</td><td><span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(item.status)">{{ item.status }}</span></td></tr></tbody></table></div>
    </div>
  </div>
</template>
