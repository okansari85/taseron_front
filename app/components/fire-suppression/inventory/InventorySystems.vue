<script setup lang="ts">
import { ChevronRight, Layers, List } from '@lucide/vue'
import type { Component } from 'vue'
import type { FireSuppressionReportControlItem } from '~/types/fire-suppression-report'
type SystemSummary = {
  category: string
  items: FireSuppressionReportControlItem[]
  registeredCount: number
  unitCount: number
  unitsNonconform: number
  controlItemCount: number
  nonconformCount: number
  status: 'uygun' | 'uygun_degil' | null
  pumpBreakdown: { main: number; jokey: number } | null
}
defineProps<{
  loading: boolean
  systemSummaries: SystemSummary[]
  categoryIcon: (category: string) => Component
  categoryLabel: (category: string) => string
  amountLabel: (item: SystemSummary) => string
  statusLabel: (status: SystemSummary['status']) => string
  statusClass: (status: SystemSummary['status']) => string
  primaryColor: string
}>()
</script>
<template>
  <section id="systems" class="scroll-mt-24 pt-5">
    <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 class="text-xl font-bold text-[#14284f] dark:text-white">Sistem Bazlı Durum</h2><p class="text-sm text-slate-500">Son rapora göre yangın tesisatında bulunan sistemlerin kontrol sonuçları.</p></div><div class="flex items-center gap-2"><button class="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold text-white shadow-sm" :style="{backgroundColor:primaryColor}"><Layers :size="15"/> Kart Görünümü</button><button class="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#50617f] dark:border-gray-700 dark:bg-gray-900 dark:text-white"><List :size="15"/> Liste Görünümü</button></div></div>
    <div v-if="loading" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><div v-for="n in 6" :key="n" class="h-32 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900"/></div>
    <div v-else-if="!systemSummaries.length" class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900"><Layers class="mx-auto text-slate-300" :size="32"/><p class="mt-3 text-sm font-semibold text-slate-700 dark:text-white">Henüz kayıtlı yangın tesisatı sistemi bulunmuyor.</p><p class="mt-1 text-xs text-slate-400">Sistem Ekle ile tesisat envanterini oluşturmaya başlayabilirsiniz.</p></div>
    <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink v-for="system in systemSummaries" :key="system.category" :to="`/isg-portal/desktop/fire-suppression/systems/${system.category}`" class="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-start justify-between gap-3"><div class="flex min-w-0 items-center gap-3"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 dark:bg-gray-800 dark:text-slate-300"><component :is="categoryIcon(system.category)" :size="24"/></div><div class="min-w-0"><h3 class="truncate text-sm font-bold text-[#14284f] dark:text-white">{{categoryLabel(system.category)}}</h3><p class="mt-0.5 truncate text-xs text-slate-500">{{amountLabel(system)}}</p></div></div><ChevronRight :size="19" class="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" :style="{color:primaryColor}"/></div>
        <div class="mt-3"><span :class="['inline-flex rounded-md px-2 py-1 text-[11px] font-bold',statusClass(system.status)]">{{statusLabel(system.status)}}</span></div>
        <div v-if="system.nonconformCount>0" class="mt-3"><div class="mb-1 flex items-center justify-between text-[11px] font-semibold"><span class="text-slate-400">{{system.controlItemCount}} kontrol maddesi</span><span class="text-red-500">{{system.nonconformCount}} / {{system.controlItemCount}} uygunsuz</span></div><div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-red-400" :style="{width:`${Math.min(100,(system.nonconformCount/Math.max(1,system.controlItemCount))*100)}%`}"/></div></div>
        <div v-else class="mt-3 flex items-center gap-2 text-xs text-slate-500"><span>{{system.controlItemCount}} kontrol maddesi</span><span class="text-slate-300">|</span><span>{{system.nonconformCount}} uygunsuzluk</span></div>
      </NuxtLink>
    </div>
  </section>
</template>
<style scoped>
.status-success { background: #e9fbf2; color: #10a66a; }
.status-danger { background: #fff0f0; color: #ef4444; }
.status-neutral { background: #eef2f7; color: #51627d; }
</style>
