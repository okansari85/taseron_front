<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-1 text-theme-xs font-medium"
    :class="toneClasses[dangerClass]"
  >
    {{ dangerClass }}
  </span>
</template>

<script setup lang="ts">
type DangerClass = 'Çok Tehlikeli' | 'Tehlikeli' | 'Az Tehlikeli'

const props = defineProps<{
  dangerClass: DangerClass
}>()

const toneClasses: Record<DangerClass, string> = {
  'Çok Tehlikeli': 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500',
  Tehlikeli: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  'Az Tehlikeli': 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
}
</script>
