<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDays, UserRound, ClipboardList, ArrowUpRight } from 'lucide-vue-next'
import ContractorVisitsCalendar from '~/components/contractors/visits/ContractorVisitsCalendar.vue'
import ContractorVisitsTable from '~/components/contractors/visits/ContractorVisitsTable.vue'
import ContractorVisitsPeople from '~/components/contractors/visits/ContractorVisitsPeople.vue'
import ContractorVisitsHistory from '~/components/contractors/visits/ContractorVisitsHistory.vue'

type Visit = { date: string; location: string; business: string; purpose: string; people: number; status: string; personnel?: string[]; vehicles?: string[]; equipment?: string[]; chemicals?: string[] }
const props = defineProps<{ visits: Visit[]; historyUrl: string }>()
const activeSection = ref<'visits' | 'people' | 'history'>('visits')
const today = new Date()
const selectedYear = ref(today.getFullYear())
const normalizeDate=(value:string)=>{const parts=value.split('.');return parts.length===3?`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`:value}
const toDate=(value:string)=>new Date(`${normalizeDate(value)}T00:00:00`)
const annualVisits=computed(()=>props.visits.filter(v=>toDate(v.date).getFullYear()===selectedYear.value))
const statusMeta = { Planlanan:{},'Devam Ediyor':{},Tamamlandı:{} } as const
const statusCount=(status:string)=>annualVisits.value.filter(v=>v.status===status).length
</script>

<template>
<section class="rounded-xl border border-gray-200 bg-white shadow-theme-xs overflow-hidden">
  <div class="flex min-h-[720px] flex-col md:flex-row">
    <aside class="w-full shrink-0 border-b border-gray-100 bg-gray-50/50 p-3 md:w-52 md:border-b-0 md:border-r">
      <div class="px-3 py-2"><p class="text-xs font-semibold text-gray-900">Saha Ziyaretleri</p><p class="mt-1 text-[11px] text-gray-500">Geçici alt yüklenici</p></div>
      <nav class="mt-3 space-y-1">
        <button type="button" @click="activeSection='visits'" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors" :class="activeSection==='visits'?'bg-brand-50 text-brand-600':'text-gray-600 hover:bg-white hover:text-gray-900'"><CalendarDays :size="16"/> Ziyaretler</button>
        <button type="button" @click="activeSection='people'" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors" :class="activeSection==='people'?'bg-brand-50 text-brand-600':'text-gray-600 hover:bg-white hover:text-gray-900'"><UserRound :size="16"/> Personeller</button>
        <button type="button" @click="activeSection='history'" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors" :class="activeSection==='history'?'bg-brand-50 text-brand-600':'text-gray-600 hover:bg-white hover:text-gray-900'"><ClipboardList :size="16"/> İşlem Geçmişi</button>
      </nav>
    </aside>
    <div class="min-w-0 flex-1 p-6">
      <template v-if="activeSection==='visits'">
        <div class="mb-6 flex items-center justify-between gap-4"><div><h2 class="text-sm font-semibold text-gray-900">Saha Ziyaretleri</h2><p class="mt-1 text-xs text-gray-500">Geçici alt yüklenicinin planlanan ve gerçekleşen saha ziyaretleri.</p></div><NuxtLink :to="props.historyUrl" class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Tümünü Gör <ArrowUpRight :size="13"/></NuxtLink></div>
        <div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><div class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><p class="text-xs text-gray-500">Toplam Ziyaret</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ annualVisits.length }}</p><p class="mt-1 text-[11px] text-gray-400">{{ selectedYear }} yılı</p></div><div v-for="status in Object.keys(statusMeta)" :key="status" class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><p class="text-xs text-gray-500">{{ status }}</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ statusCount(status) }}</p><p class="mt-1 text-[11px] text-gray-400">ziyaret</p></div></div>
        <ContractorVisitsCalendar :visits="props.visits" />
        <ContractorVisitsTable :visits="props.visits" />
      </template>
      <ContractorVisitsPeople v-else-if="activeSection==='people'" :visits="props.visits" />
      <ContractorVisitsHistory v-else :visits="props.visits" />
    </div>
  </div>
</section>
</template>