<script setup lang="ts">
import { computed, ref } from 'vue'

type Visit = { date:string; location:string; business:string; purpose:string; people:number; status:string }
const props = defineProps<{ visits: Visit[]; historyUrl?: string }>()
const viewMode = ref<'month'|'year'>('month')
const currentDate = ref(new Date())
const monthTitle = computed(() => currentDate.value.toLocaleDateString('tr-TR',{month:'long',year:'numeric'}))
const year = computed(() => currentDate.value.getFullYear())
const month = computed(() => currentDate.value.getMonth())
const monthVisits = computed(() => props.visits.filter(v => { const [d,m,y]=v.date.split('.').map(Number); return y===year.value && m-1===month.value }))
const yearVisits = computed(() => props.visits.filter(v => Number(v.date.split('.')[2])===year.value))
const completed = computed(() => yearVisits.value.filter(v=>v.status==='Tamamlandı').length)
const planned = computed(() => yearVisits.value.filter(v=>v.status==='Planlanan').length)
const ongoing = computed(() => yearVisits.value.filter(v=>v.status==='Devam Ediyor').length)
const totalPeople = computed(() => yearVisits.value.reduce((s,v)=>s+v.people,0))
const changeMonth = (delta:number) => { const d=new Date(currentDate.value); d.setMonth(d.getMonth()+delta); currentDate.value=d }
const changeYear = (delta:number) => { const d=new Date(currentDate.value); d.setFullYear(d.getFullYear()+delta); currentDate.value=d }
const statusClass = (status:string) => status==='Tamamlandı'?'bg-success-50 text-success-600':status==='Devam Ediyor'?'bg-amber-50 text-amber-600':'bg-brand-50 text-brand-600'
</script>
<template>
  <div class="space-y-5">
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Toplam Ziyaret</p><p class="mt-1 text-xl font-semibold text-gray-900">{{ yearVisits.length }}</p></div>
      <div class="rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Planlanan</p><p class="mt-1 text-xl font-semibold text-brand-600">{{ planned }}</p></div>
      <div class="rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Devam Ediyor</p><p class="mt-1 text-xl font-semibold text-amber-600">{{ ongoing }}</p></div>
      <div class="rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Tamamlandı</p><p class="mt-1 text-xl font-semibold text-success-600">{{ completed }}</p></div>
    </div>
    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs">
      <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div class="flex items-center gap-2">
          <button type="button" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50" @click="viewMode==='month'?changeMonth(-1):changeYear(-1)">‹</button>
          <span class="min-w-[150px] text-center text-sm font-semibold capitalize text-gray-800">{{ viewMode==='month' ? monthTitle : year }}</span>
          <button type="button" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50" @click="viewMode==='month'?changeMonth(1):changeYear(1)">›</button>
        </div>
        <div class="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          <button type="button" class="rounded-md px-3 py-1.5 text-xs font-medium" :class="viewMode==='month'?'bg-white text-brand-600 shadow-sm':'text-gray-500'" @click="viewMode='month'">Ay</button>
          <button type="button" class="rounded-md px-3 py-1.5 text-xs font-medium" :class="viewMode==='year'?'bg-white text-brand-600 shadow-sm':'text-gray-500'" @click="viewMode='year'">Yıl</button>
        </div>
      </div>
      <div v-if="viewMode==='month'" class="p-5">
        <div class="mb-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-100 bg-gray-100 text-center text-[11px] font-medium text-gray-500"><div v-for="d in ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']" :key="d" class="bg-white py-2">{{ d }}</div></div>
        <div class="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-100 bg-gray-100">
          <div v-for="n in 35" :key="n" class="min-h-20 bg-white p-2"><span class="text-xs text-gray-400">{{ n }}</span><div v-for="v in monthVisits.filter(x=>Number(x.date.split('.')[0])===n)" :key="v.date+v.purpose" class="mt-1 truncate rounded px-1.5 py-1 text-[10px] font-medium" :class="statusClass(v.status)">{{ v.purpose }}</div></div>
        </div>
      </div>
      <div v-else class="grid grid-cols-2 gap-3 p-5 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="m in 12" :key="m" class="rounded-lg border border-gray-100 p-3"><div class="flex items-center justify-between"><span class="text-xs font-semibold capitalize text-gray-700">{{ new Date(year,m-1,1).toLocaleDateString('tr-TR',{month:'long'}) }}</span><span class="text-[10px] text-gray-400">{{ yearVisits.filter(v=>Number(v.date.split('.')[1])===m).length }} ziyaret</span></div><div class="mt-2 h-1.5 rounded-full bg-gray-100"><div class="h-1.5 rounded-full bg-brand-500" :style="{width:`${Math.min(100,yearVisits.filter(v=>Number(v.date.split('.')[1])===m).length*20)}%`}" /></div></div>
      </div>
    </section>
    <section class="rounded-xl border border-gray-200 bg-white shadow-theme-xs"><div class="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><h3 class="text-sm font-semibold text-gray-900">Ziyaret Geçmişi</h3><p class="mt-1 text-xs text-gray-500">{{ yearVisits.length }} kayıt · {{ totalPeople }} kişi</p></div><NuxtLink v-if="historyUrl" :to="historyUrl" class="text-xs font-semibold text-brand-600">Tümünü Gör</NuxtLink></div><div class="divide-y divide-gray-100"><div v-for="v in yearVisits" :key="v.date+v.purpose" class="flex items-center justify-between gap-4 px-5 py-4"><div class="min-w-0"><p class="text-sm font-medium text-gray-800">{{ v.purpose }}</p><p class="mt-1 text-xs text-gray-500">{{ v.date }} · {{ v.location }} · {{ v.business }}</p></div><span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium" :class="statusClass(v.status)">{{ v.status }}</span></div></div></section>
  </div>
</template>