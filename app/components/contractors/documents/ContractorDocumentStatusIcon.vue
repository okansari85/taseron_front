<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'

defineProps<{ complete: boolean; size?: number }>()
</script>

<template>
  <span class="mx-auto flex h-7 w-7 items-center justify-center rounded-full" :class="complete ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-500'">
    <Check v-if="complete" :size="size ?? 15" />
    <X v-else :size="size ?? 15" />
  </span>
</template>
