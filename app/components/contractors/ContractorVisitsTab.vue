<script setup lang="ts">
import { CalendarDays, CheckCircle2, Clock3, MapPin, Users, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-vue-next'
type Visit={date:string;location:string;business:string;purpose:string;people:number;status:string}
defineProps<{ visits: Visit[]; historyUrl: string }>()
const statusMeta={
  Planlanan:{icon:CalendarDays,classes:'bg-brand-50 text-brand-600',dot:'bg-brand-500'},
  'Devam Ediyor':{icon:Clock3,classes:'bg-warning-50 text-warning-600',dot:'bg-warning-500'},
  Tamamlandı:{icon:CheckCircle2,classes:'bg-success-50 text-success-600',dot:'bg-success-500'},
}
const selectedYear=ref(2026)
const monthNames=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const weekDays=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
const normalizeDate=(value:string)=>{const parts=value.split('.');return parts.length===3?`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`:value}
const visitsForDate=(year:number,month:number,day:number)=>visits.filter(v=>{const d=new Date(normalizeDate(v.date));return d.getFullYear()===year&&d.getMonth()===month&&d.getDate()===day})
const daysInMonth=(year:number,month:number)=>new Date(year,month+1,0).getDate()
const mondayOffset=(year:number,month:number)=>{const day=new Date(year,month,1).getDay();return day===0?6:day-1}
const monthWeeks=(month:number)=>{
  const days=daysInMonth(selectedYear.value,month);const cells:Array<number|null>=Array(mondayOffset(selectedYear.value,month)).fill(null);for(let d=1;d<=days;d++)cells.push(d);while(cells.length%7)cells.push(null);return cells
}
const annualVisits=computed(()=>visits.filter(v=>new Date(normalizeDate(v.date)).getFullYear()===selectedYear.value))
const statusCount=(status:string)=>annualVisits.value.filter(v=>v.status===status).length
const annualPeople=computed(()=>annualVisits.value.reduce((sum,v)=>sum+v.people,0))
const monthCount=(month:number)=>annualVisits.value.filter(v=>new Date(normalizeDate(v.date)).getMonth()===month).length
const shiftYear=(amount:number)=>{selectedYear.value+=amount}
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
  <div class="mb-6 flex items-center justify-between gap-4">
    <div><h2 class="text-sm font-semibold text-gray-900">Saha Ziyaretleri</h2><p class="mt-1 text-xs text-gray-500">Geçici alt yüklenicinin planlanan ve gerçekleşen saha ziyaretleri.</p></div>
    <NuxtLink :to="historyUrl" class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Tümünü Gör <ArrowUpRight :size="13"/></NuxtLink>
  </div>

  <div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
    <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><p class="text-xs text-gray-500">Toplam Ziyaret</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ annualVisits.length }}</p><p class="mt-1 text-[11px] text-gray-400">{{ selectedYear }} yılı</p></div>
    <div v-for="(meta,status) in statusMeta" :key="status" class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><div class="flex items-center justify-between"><p class="text-xs text-gray-500">{{ status }}</p><component :is="meta.icon" :size="16" :class="meta.classes.split(' ')[1]"/></div><p class="mt-1 text-2xl font-semibold text-gray-900">{{ statusCount(status) }}</p><p class="mt-1 text-[11px] text-gray-400">ziyaret</p></div>
    <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-4"><div class="flex items-center justify-between"><p class="text-xs text-gray-500">Toplam Personel</p><Users :size="16" class="text-gray-400"/></div><p class="mt-1 text-2xl font-semibold text-gray-900">{{ annualPeople }}</p><p class="mt-1 text-[11px] text-gray-400">ziyaret bazında</p></div>
  </div>

  <div class="mb-6 rounded-xl border border-gray-100 bg-gray-50/40 p-5">
    <div class="mb-5 flex items-center justify-between"><div><h3 class="text-sm font-semibold text-gray-900">{{ selectedYear }} Ziyaret Takvimi</h3><p class="mt-1 text-xs text-gray-500">Planlanan, devam eden ve tamamlanan ziyaretleri yıl genelinde takip edin.</p></div><div class="flex items-center gap-2"><button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50" @click="shiftYear(-1)"><ChevronLeft :size="15"/></button><span class="min-w-16 text-center text-xs font-semibold text-gray-700">{{ selectedYear }}</span><button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50" @click="shiftYear(1)"><ChevronRight :size="15"/></button></div></div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="(month,monthIndex) in monthNames" :key="month" class="rounded-lg border border-gray-100 bg-white p-3">
        <div class="mb-2 flex items-center justify-between"><span class="text-xs font-semibold text-gray-800">{{ month }}</span><span class="text-[10px] text-gray-400">{{ monthCount(monthIndex) }} ziyaret</span></div>
        <div class="mb-1 grid grid-cols-7 text-center"><span v-for="day in weekDays" :key="day" class="text-[9px] font-medium text-gray-400">{{ day.slice(0,1) }}</span></div>
        <div class="grid grid-cols-7 gap-y-1 text-center">
          <div v-for="(day,index) in monthWeeks(monthIndex)" :key="`${monthIndex}-${index}`" class="flex h-6 items-center justify-center">
            <template v-if="day">
              <span class="relative flex h-6 w-6 items-center justify-center rounded-full text-[10px]" :class="visitsForDate(selectedYear,monthIndex,day).length?'bg-brand-50 font-semibold text-brand-700':'text-gray-600'">{{ day }}<span v-if="visitsForDate(selectedYear,monthIndex,day).length" class="absolute bottom-0.5 h-1 w-1 rounded-full bg-brand-500"></span></span>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3 text-[11px] text-gray-500"><span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-full bg-brand-500"></i>Ziyaret olan gün</span><span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-full bg-success-500"></i>Tamamlandı</span><span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-full bg-warning-500"></i>Devam Ediyor</span><span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-full bg-brand-500"></i>Planlanan</span></div>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full min-w-[900px] text-left">
      <thead><tr class="border-b border-gray-100 text-xs text-gray-500"><th class="pb-3 font-medium">Tarih</th><th class="pb-3 font-medium">Lokasyon</th><th class="pb-3 font-medium">Organizasyon</th><th class="pb-3 font-medium">Ziyaret Nedeni</th><th class="pb-3 font-medium">Personel</th><th class="pb-3 font-medium">Durum</th></tr></thead>
      <tbody><tr v-for="visit in visits" :key="visit.date+visit.location+visit.business" class="border-b border-gray-100 last:border-0"><td class="py-4"><div class="flex items-center gap-2"><CalendarDays :size="14" class="text-gray-400"/><span class="text-sm font-medium text-gray-800">{{ visit.date }}</span></div></td><td class="py-4"><div class="flex items-center gap-1.5"><MapPin :size="14" class="text-gray-400"/><span class="text-sm text-gray-700">{{ visit.location }}</span></div></td><td class="py-4 text-xs text-gray-500">{{ visit.business }}</td><td class="py-4 text-sm text-gray-600">{{ visit.purpose }}</td><td class="py-4"><div class="flex items-center gap-1.5 text-sm text-gray-700"><Users :size="14" class="text-gray-400"/>{{ visit.people }}</div></td><td class="py-4"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" :class="statusMeta[visit.status as keyof typeof statusMeta]?.classes || 'bg-gray-100 text-gray-500'"><span class="h-1.5 w-1.5 rounded-full" :class="statusMeta[visit.status as keyof typeof statusMeta]?.dot || 'bg-gray-400'"></span>{{ visit.status }}</span></td></tr><tr v-if="!visits.length"><td colspan="6" class="py-12 text-center text-xs text-gray-500">Henüz saha ziyareti bulunmuyor.</td></tr></tbody>
    </table>
  </div>
</section>
</template>