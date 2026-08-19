<template>
  <div :class="nodeClass(tone)">
    <div class="flex items-center justify-center text-base">{{ icon }}</div>
    <div class="mt-1 text-xs font-semibold text-gray-800 dark:text-white/90">
      {{ title }}
    </div>
    <div :class="['mt-1 text-[10px] font-semibold', textClass]">
      {{ type }}
    </div>
    <div
      v-if="automatic"
      class="mt-1 inline-flex rounded-full bg-warning-50 px-2 py-0.5 text-[9px] font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
    >
      Otomatik
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  type: string
  icon: string
  tone: 'purple' | 'green' | 'blue' | 'orange'
  textClass: string
  automatic?: boolean
}>()

function nodeClass(tone: string) {
  const toneClasses: Record<string, string> = {
    purple: 'border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10',
    green: 'border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10',
    blue: 'border-blue-light-200 bg-blue-light-50 dark:border-blue-light-500/30 dark:bg-blue-light-500/10',
    orange: 'border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10',
  }

  return `w-36 rounded-lg border px-3 py-3 text-center shadow-theme-xs ${toneClasses[tone] ?? toneClasses.purple}`
}
</script>
