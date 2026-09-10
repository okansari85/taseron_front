<script setup lang="ts">
import { Check } from '@lucide/vue'

// Rapor yükleme sihirbazlarının (Yangın Söndürme Sistemleri, YSC Yıllık
// Kontrol, ...) hepsinde aynı 4 adımlı gösterge — nihai akış: Dosya Yükle →
// AI Analizi → Eşleştirme → Onayla.
defineProps<{
  steps: { number: number; label: string }[]
  currentStep: number
}>()
</script>

<template>
  <div class="flex items-center justify-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
    <template v-for="(s, i) in steps" :key="s.number">
      <div class="flex items-center gap-2">
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          :class="currentStep === s.number ? 'bg-[#d71920] text-white' : currentStep > s.number ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-white/10'"
        >
          <Check v-if="currentStep > s.number" :size="13" />
          <template v-else>{{ s.number }}</template>
        </span>
        <span class="hidden text-xs font-semibold sm:inline" :class="currentStep === s.number ? 'text-[#172033] dark:text-white' : 'text-gray-400'">{{ s.label }}</span>
      </div>
      <div v-if="i < steps.length - 1" class="h-px w-6 shrink-0 bg-gray-200 dark:bg-gray-700" />
    </template>
  </div>
</template>
