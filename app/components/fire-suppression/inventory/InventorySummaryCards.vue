<script setup lang="ts">
import { CheckCircle2, ClipboardList, Cylinder, Info, Layers, XCircle } from '@lucide/vue'
type Summary = { systemCount: number; totalUnits: number; controls: number; suitable: number; unsuitable: number; notApplicable: number }
defineProps<{ overallSummary: Summary }>()
</script>
<template>
  <section id="summary" class="scroll-mt-24 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
    <div v-for="card in [{value:overallSummary.systemCount,label:'Tespit Edilen Sistem',icon:Layers,tone:'violet'},{value:overallSummary.totalUnits,label:'Toplam Ekipman',icon:Cylinder,tone:'blue'},{value:overallSummary.controls,label:'Kontrol Maddesi',icon:ClipboardList,tone:'sky'},{value:overallSummary.suitable,label:'Uygun',icon:CheckCircle2,tone:'green'},{value:overallSummary.unsuitable,label:'Uygun Değil',icon:XCircle,tone:'red'},{value:overallSummary.notApplicable,label:'Uygulanması Yok',icon:Info,tone:'gray'}]" :key="card.label" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div :class="['flex h-9 w-9 items-center justify-center rounded-lg',`tone-${card.tone}`]"><component :is="card.icon" :size="17"/></div><p class="mt-3 text-xl font-bold text-[#14284f] dark:text-white">{{card.value}}</p><p class="mt-0.5 text-[11px] text-slate-400">{{card.label}}</p></div>
  </section>
</template>
<style scoped>
.tone-violet { background: #f2edff; color: #7c3aed; }
.tone-blue { background: #edf5ff; color: #2563eb; }
.tone-sky { background: #edf8ff; color: #0ea5e9; }
.tone-green { background: #eafaf2; color: #10a66a; }
.tone-red { background: #fff0f0; color: #ef4444; }
.tone-gray { background: #f1f4f8; color: #64748b; }
</style>
