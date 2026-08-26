<script setup lang="ts">
import { FileText, Check, X } from 'lucide-vue-next'

defineProps<{ documents: Record<string, boolean>; title?: string }>()
</script>

<template>
  <div class="rounded-lg border border-gray-100 bg-white p-3">
    <div class="mb-2 flex items-center gap-2">
      <FileText :size="14" class="text-gray-400" />
      <span class="text-xs font-semibold text-gray-700">{{ title ?? 'Evrak Kontrolü' }}</span>
    </div>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="(isValid, documentName) in documents" :key="documentName" class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
        <span class="text-xs text-gray-600">{{ documentName }}</span>
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" :class="isValid ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-500'">
          <Check v-if="isValid" :size="13" />
          <X v-else :size="13" />
        </span>
      </div>
    </div>
  </div>
</template>
