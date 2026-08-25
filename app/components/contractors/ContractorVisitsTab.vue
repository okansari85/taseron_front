<script setup lang="ts">
import { CalendarDays, CheckCircle2, Clock3, MapPin, Users, ArrowUpRight } from 'lucide-vue-next'
type Visit={date:string;location:string;business:string;purpose:string;people:number;status:string}
defineProps<{ visits: Visit[]; historyUrl: string }>()
const statusMeta={
  Planlanan:{icon:CalendarDays,classes:'bg-brand-50 text-brand-600',dot:'bg-brand-500'},
  'Devam Ediyor':{icon:Clock3,classes:'bg-warning-50 text-warning-600',dot:'bg-warning-500'},
  Tamamlandı:{icon:CheckCircle2,classes:'bg-success-50 text-success-600',dot:'bg-success-500'},
}
const countStatus=(status:string)=>0
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
  <div class="mb-6 flex items-center justify-between gap-4">
    <div><h2 class="text-sm font-semibold text-gray-900">Saha Ziyaretleri</h2><p class="mt-1 text-xs text-gray-500">Geçici alt yüklenicinin planlanan ve gerçekleşen saha ziyaretleri.</p></div>
    <NuxtLink :to="historyUrl" class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Tümünü Gör <ArrowUpRight :size="13"/></NuxtLink>
  </div>
  <div class="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
    <div v-for="(meta,status) in statusMeta" :key="status" class="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div class="flex items-center justify-between"><div class="flex h-9 w-9 items-center justify-center rounded-lg" :class="meta.classes"><component :is="meta.icon" :size="17"/></div><span class="text-2xl font-semibold text-gray-900">{{ visits.filter(v=>v.status===status).length }}</span></div>
      <p class="mt-3 text-xs font-medium text-gray-700">{{ status }}</p><p class="mt-1 text-[11px] text-gray-500">Saha ziyareti</p>
    </div>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[900px] text-left">
      <thead><tr class="border-b border-gray-100 text-xs text-gray-500"><th class="pb-3 font-medium">Tarih</th><th class="pb-3 font-medium">Lokasyon</th><th class="pb-3 font-medium">Organizasyon</th><th class="pb-3 font-medium">Ziyaret Nedeni</th><th class="pb-3 font-medium">Personel</th><th class="pb-3 font-medium">Durum</th></tr></thead>
      <tbody>
        <tr v-for="visit in visits" :key="visit.date+visit.location+visit.business" class="border-b border-gray-100 last:border-0">
          <td class="py-4"><div class="flex items-center gap-2"><CalendarDays :size="14" class="text-gray-400"/><span class="text-sm font-medium text-gray-800">{{ visit.date }}</span></div></td>
          <td class="py-4"><div class="flex items-center gap-1.5"><MapPin :size="14" class="text-gray-400"/><span class="text-sm text-gray-700">{{ visit.location }}</span></div></td>
          <td class="py-4 text-xs text-gray-500">{{ visit.business }}</td>
          <td class="py-4 text-sm text-gray-600">{{ visit.purpose }}</td>
          <td class="py-4"><div class="flex items-center gap-1.5 text-sm text-gray-700"><Users :size="14" class="text-gray-400"/>{{ visit.people }}</div></td>
          <td class="py-4"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" :class="statusMeta[visit.status as keyof typeof statusMeta]?.classes || 'bg-gray-100 text-gray-500'"><span class="h-1.5 w-1.5 rounded-full" :class="statusMeta[visit.status as keyof typeof statusMeta]?.dot || 'bg-gray-400'"></span>{{ visit.status }}</span></td>
        </tr>
        <tr v-if="!visits.length"><td colspan="6" class="py-12 text-center text-xs text-gray-500">Henüz saha ziyareti bulunmuyor.</td></tr>
      </tbody>
    </table>
  </div>
</section>
</template>