<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-1 text-theme-xs font-medium',
      toneClasses[tone],
    ]"
  >
    <span v-if="dot" class="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ tone?: 'success' | 'warning' | 'error' | 'brand' | 'gray' }>(),
  { tone: 'gray' },
)

const toneClasses = {
  success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  error: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500',
  brand: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400',
}
</script>
