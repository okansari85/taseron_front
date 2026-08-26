<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDays, CheckCircle2, Clock3 } from 'lucide-vue-next'
import FullCalendar from '@fullcalendar/vue3'
import multiMonthPlugin from '@fullcalendar/multimonth'
import dayGridPlugin from '@fullcalendar/daygrid'
import trLocale from '@fullcalendar/core/locales/tr'

type Visit = { date: string; location: string; business: string; purpose: string; people: number; status: string; personnel?: string[]; vehicles?: string[]; equipment?: string[]; chemicals?: string[] }
const props = defineProps<{ visits: Visit[] }>()
const emit = defineEmits<{ yearChanged: [year: number] }>()
const today = new Date()
const selectedYear = ref(today.getFullYear())
const calendarView = ref<'month' | 'year'>('month')
const currentMonthDate = ref(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`)
const statusMeta = { Planlanan:{icon:CalendarDays,classes:'bg-brand-50 text-brand-600',dot:'bg-brand-500',color:'#6366f1'},'Devam Ediyor':{icon:Clock3,classes:'bg-warning-50 text-warning-600',dot:'bg-warning-500',color:'#f59e0b'},Tamamlandı:{icon:CheckCircle2,classes:'bg-success-50 text-success-600',dot:'bg-success-500',color:'#10b981'} } as const
const normalizeDate=(value:string)=>{const parts=value.split('.');return parts.length===3?`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`:value}
const toDate=(value:string)=>new Date(`${normalizeDate(value)}T00:00:00`)
const annualVisits=computed(()=>props.visits.filter(v=>toDate(v.date).getFullYear()===selectedYear.value))
const statusCount=(status:string)=>annualVisits.value.filter(v=>v.status===status).length
const calendarEvents=computed(()=>props.visits.map((visit,index)=>{const meta=statusMeta[visit.status as keyof typeof statusMeta];return{id:`${visit.date}-${visit.location}-${index}`,title:visit.location,start:normalizeDate(visit.date),allDay:true,backgroundColor:meta?.color??'#64748b',borderColor:meta?.color??'#64748b',textColor:'#ffffff',extendedProps:{status:visit.status,business:visit.business,purpose:visit.purpose,people:visit.people}}}))
const calendarOptions=computed(()=>({plugins:[multiMonthPlugin,dayGridPlugin],initialView:calendarView.value==='year'?'multiMonthYear':'dayGridMonth',initialDate:calendarView.value==='year'?`${selectedYear.value}-01-01`:currentMonthDate.value,locale:trLocale,firstDay:1,height:'auto',fixedWeekCount:false,dayMaxEvents:2,eventDisplay:'block',displayEventTime:false,multiMonthMaxColumns:3,multiMonthMinWidth:260,headerToolbar:{left:'prev,next today',center:'title',right:''},buttonText:{today:'Bugün'},events:calendarEvents.value}))
const setCalendarView=(view:'month'|'year')=>{calendarView.value=view}
const handleDatesSet=(info:{start:Date;view?:{currentStart?:Date}})=>{const year=info.start.getFullYear();if(year!==selectedYear.value){selectedYear.value=year;emit('yearChanged',year)}if(calendarView.value==='month'){const date=info.view?.currentStart??info.start;currentMonthDate.value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-01`}}
</script>
<template>
<div class="mb-6 rounded-xl border border-gray-100 bg-gray-50/40 p-5">
  <div class="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 class="text-sm font-semibold text-gray-900">{{ selectedYear }} Ziyaret Takvimi</h3><p class="mt-1 text-xs text-gray-500">Planlanan, devam eden ve tamamlanan ziyaretleri takip edin.</p></div><div class="flex flex-wrap items-center gap-3"><div class="inline-flex rounded-lg border border-gray-200 bg-white p-0.5"><button type="button" class="rounded-md px-3 py-1.5 text-[11px] font-medium" :class="calendarView==='month'?'bg-brand-50 text-brand-600':'text-gray-500 hover:text-gray-800'" @click="setCalendarView('month')">Ay</button><button type="button" class="rounded-md px-3 py-1.5 text-[11px] font-medium" :class="calendarView==='year'?'bg-brand-50 text-brand-600':'text-gray-500 hover:text-gray-800'" @click="setCalendarView('year')">Yıl</button></div><div class="flex flex-wrap items-center gap-4 text-[11px] text-gray-500"><span v-for="(meta,status) in statusMeta" :key="status" class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-full" :class="meta.dot"/>{{ status }}</span></div></div></div>
  <div class="overflow-hidden rounded-lg border border-gray-100 bg-white p-2"><ClientOnly><FullCalendar :key="calendarView" :options="calendarOptions" @dates-set="handleDatesSet"/><template #fallback><div class="flex min-h-[420px] items-center justify-center text-xs text-gray-400">Takvim yükleniyor...</div></template></ClientOnly></div>
</div>
</template>
<style>
.fc{--fc-border-color:#eef2f6;--fc-page-bg-color:transparent;--fc-neutral-bg-color:#f8fafc;--fc-today-bg-color:#f5f3ff;font-family:inherit}.fc .fc-toolbar{margin-bottom:1rem;gap:.75rem}.fc .fc-toolbar-title{font-size:.875rem;font-weight:600;color:#111827}.fc .fc-button{border:1px solid #e5e7eb;background:#fff;color:#6b7280;box-shadow:none;font-size:.7rem;font-weight:500;padding:.4rem .65rem}.fc .fc-button:hover,.fc .fc-button:focus,.fc .fc-button:active{border-color:#d1d5db;background:#f9fafb;color:#374151;box-shadow:none}.fc .fc-button-primary:not(:disabled).fc-button-active,.fc .fc-button-primary:not(:disabled):active{border-color:#e5e7eb;background:#f5f3ff;color:#4f46e5}.fc .fc-multimonth{border:0}.fc .fc-multimonth-month{border-color:#eef2f6;border-radius:.75rem;overflow:hidden}.fc .fc-multimonth-title{padding:.65rem .75rem;font-size:.75rem;font-weight:600;color:#374151}.fc .fc-col-header-cell-cushion,.fc .fc-daygrid-day-number{font-size:.65rem;color:#6b7280}.fc .fc-daygrid-day-number{padding:.3rem}.fc .fc-daygrid-day.fc-day-today{background:#f5f3ff}.fc .fc-event{border-radius:.25rem;border-width:0;padding:1px 3px;font-size:.6rem;line-height:1.25;font-weight:600}.fc .fc-daygrid-more-link{font-size:.6rem;color:#6366f1}@media(max-width:768px){.fc .fc-toolbar{flex-wrap:wrap}.fc .fc-toolbar-title{order:-1;width:100%;text-align:center}}
</style>