<script setup lang="ts">
type Summary = { controls: number; suitable: number; unsuitable: number; notApplicable: number }
type SystemSummary = { category: string; nonconformCount: number }
type FacilityInfo = { label: string; value: string }
defineProps<{
  overallSummary: Summary
  suitablePercent: number
  unsuitablePercent: number
  noResultPercent: number
  ringStyle: Record<string, string>
  systemSummaries: SystemSummary[]
  maxNonconform: number
  categoryLabel: (category: string) => string
  facilityInfo: FacilityInfo[]
}>()
</script>
<template>
  <section class="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(300px,.9fr)]">
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Kontrol Sonuçlarının Dağılımı</h3><div class="mt-4 flex items-center justify-center gap-8"><div class="relative h-40 w-40 shrink-0 rounded-full p-4" :style="ringStyle"><div class="flex h-full w-full flex-col items-center justify-center rounded-full bg-white dark:bg-gray-900"><strong class="text-2xl text-[#14284f] dark:text-white">{{overallSummary.controls}}</strong><span class="text-[10px] text-slate-400">Kontrol Maddesi</span></div></div><div class="space-y-3 text-xs"><div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-sm bg-emerald-400"/><span class="text-slate-500">Uygun</span><strong>{{overallSummary.suitable}} ({{suitablePercent}}%)</strong></div><div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-sm bg-red-400"/><span class="text-slate-500">Uygun Değil</span><strong>{{overallSummary.unsuitable}} ({{unsuitablePercent}}%)</strong></div><div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-sm bg-slate-400"/><span class="text-slate-500">Uygulaması Yok</span><strong>{{overallSummary.notApplicable}} ({{noResultPercent}}%)</strong></div></div></div></div>
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Sistemlere Göre Uygunsuzluk Sayısı</h3><div class="mt-4 space-y-3"><div v-for="system in systemSummaries" :key="`bar-${system.category}`" class="grid grid-cols-[120px_minmax(0,1fr)_24px] items-center gap-2 text-xs"><span class="truncate text-slate-500">{{categoryLabel(system.category)}}</span><div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-red-400" :style="{width:`${(system.nonconformCount/maxNonconform)*100}%`}"/></div><strong class="text-right text-[#14284f] dark:text-white">{{system.nonconformCount}}</strong></div></div></div>
    <div id="general" class="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Tesisat Bilgileri (Rapor'dan)</h3><div class="mt-3 divide-y divide-slate-100 dark:divide-gray-800"><div v-for="info in facilityInfo" :key="info.label" class="flex items-center justify-between gap-4 py-2 text-xs"><span class="text-slate-400">{{info.label}}</span><strong class="text-right text-[#14284f] dark:text-white">{{info.value}}</strong></div></div></div>
  </section>
</template>
