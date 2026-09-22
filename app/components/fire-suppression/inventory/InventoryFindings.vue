<script setup lang="ts">
import type { FireSuppressionReport } from '~/types/fire-suppression-report'
defineProps<{ report: FireSuppressionReport | null; categoryLabel: (category: string) => string }>()
</script>
<template>
  <section id="findings" class="scroll-mt-24 mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div class="flex items-center justify-between"><div><h3 class="text-sm font-bold text-[#14284f] dark:text-white">Uygunsuzluklar</h3><p class="mt-1 text-xs text-slate-400">Son raporda tespit edilen uygunsuzluklar.</p></div><span class="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">{{report?.findings?.length??0}}</span></div><div v-if="report?.findings?.length" class="mt-4 space-y-2"><div v-for="finding in report.findings" :key="finding.id" class="rounded-lg border border-red-100 bg-red-50/40 p-3 dark:border-red-900/30 dark:bg-red-900/10"><p class="text-xs font-semibold text-slate-700 dark:text-white">{{finding.description}}</p><p class="mt-1 text-[10px] text-slate-400">{{categoryLabel(finding.category||'diger')}} · {{finding.status==='open'?'Açık':'Kapalı'}}</p></div></div><p v-else class="mt-4 rounded-lg bg-slate-50 px-4 py-5 text-center text-xs text-slate-400 dark:bg-gray-800">Son raporda kayıtlı uygunsuzluk bulunmuyor.</p></section>
</template>
