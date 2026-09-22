<script setup lang="ts">
import { ArrowRight, Calendar, CheckCircle2, FileText, Info, ShieldCheck, XCircle } from '@lucide/vue'
import type { FireSuppressionReport } from '~/types/fire-suppression-report'
defineProps<{
  report: FireSuppressionReport | null
  overallStatus: string
  overallStatusClass: string
  latestControlLabel: string
  primaryColor: string
  formatDate: (value?: string | null) => string
  daysRemaining: (value?: string | null) => number | null
}>()
</script>
<template>
  <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div class="grid divide-y divide-slate-100 md:grid-cols-4 md:divide-x md:divide-y-0 dark:divide-gray-800">
      <div class="flex items-center gap-4 p-4 md:p-5"><div :class="['flex h-14 w-14 shrink-0 items-center justify-center rounded-xl', overallStatusClass === 'is-danger' ? 'bg-red-50 text-red-500' : overallStatusClass === 'is-success' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-500']"><XCircle v-if="overallStatusClass === 'is-danger'" :size="29"/><CheckCircle2 v-else-if="overallStatusClass === 'is-success'" :size="29"/><Info v-else :size="27"/></div><div class="min-w-0"><p class="text-xs font-medium text-slate-500">Genel Durum</p><p class="mt-0.5 text-lg font-bold" :style="{color:overallStatusClass==='is-success'?'#16a66a':overallStatusClass==='is-danger'?primaryColor:'#64748b'}">{{overallStatus}}</p><p class="mt-0.5 text-[11px] leading-4 text-slate-400">{{report?'Son rapora göre tesisat sonucu.':'Henüz geçerli periyodik kontrol raporu bulunmuyor.'}}</p></div></div>
      <div class="flex items-center gap-4 p-4 md:p-5"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500"><Calendar :size="24"/></div><div><p class="text-xs font-medium text-slate-500">Son Periyodik Kontrol</p><p class="mt-1 text-base font-bold text-[#14284f] dark:text-white">{{formatDate(report?.report_date)}}</p><p class="mt-0.5 text-xs text-slate-400">{{latestControlLabel}}</p></div></div>
      <div class="flex items-center gap-4 p-4 md:p-5"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500"><ShieldCheck :size="24"/></div><div><p class="text-xs font-medium text-slate-500">Geçerlilik Tarihi</p><p class="mt-1 text-base font-bold text-[#14284f] dark:text-white">{{formatDate(report?.next_control_date)}}</p><p v-if="daysRemaining(report?.next_control_date)!==null" class="mt-0.5 text-xs font-semibold text-emerald-500">Kalan süre: {{daysRemaining(report?.next_control_date)}} gün</p><p v-else class="mt-0.5 text-xs text-slate-400">Tarih bilgisi bulunmuyor.</p></div></div>
      <div class="flex items-center gap-4 p-4 md:p-5"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><FileText :size="24"/></div><div class="min-w-0"><p class="text-xs font-medium text-slate-500">Rapor No</p><p class="mt-1 truncate text-base font-bold text-[#14284f] dark:text-white">{{report?.report_no||'—'}}</p><a v-if="report" :href="report.file_url" target="_blank" rel="noopener" class="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold underline" :style="{color:primaryColor}">Raporu Görüntüle <ArrowRight :size="13"/></a></div></div>
    </div>
  </section>
</template>
