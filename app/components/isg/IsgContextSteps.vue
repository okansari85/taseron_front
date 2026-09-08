<script setup lang="ts">
import { Check } from '@lucide/vue'

defineProps<{ currentStep: 1 | 2; locationName?: string }>()
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2.5">
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        :class="currentStep > 1 ? 'bg-brand-600 text-white' : 'bg-error-500 text-white'"
      >
        <Check v-if="currentStep > 1" :size="15" />
        <template v-else>1</template>
      </span>
      <div>
        <p class="text-xs font-semibold" :class="currentStep > 1 ? 'text-brand-600' : 'text-error-500'">Lokasyon Seç</p>
        <p v-if="locationName" class="text-[11px] text-gray-400">{{ locationName }}</p>
      </div>
    </div>
    <span class="h-px w-16 bg-gray-200 dark:bg-gray-700" />
    <div class="flex items-center gap-2.5">
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        :class="currentStep === 2 ? 'bg-error-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-white/5'"
      >2</span>
      <p class="text-xs font-semibold" :class="currentStep === 2 ? 'text-error-500' : 'text-gray-400'">Şube Seç</p>
    </div>
  </div>
</template>
