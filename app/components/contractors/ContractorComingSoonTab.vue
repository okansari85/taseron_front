<script setup lang="ts">
import { Construction } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    description: string
    items?: string[]
  }>(),
  { items: () => [] },
)
</script>
<template>
  <section class="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-10 text-center dark:border-gray-700 dark:bg-white/[0.02]">
    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
      <Construction :size="22" />
    </div>
    <h2 class="mt-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ title }}</h2>
    <p class="mx-auto mt-2 max-w-lg text-xs leading-5 text-gray-500">{{ description }}</p>
    <ul v-if="items.length" class="mx-auto mt-4 max-w-md space-y-1.5 text-left text-xs text-gray-500">
      <li v-for="item in items" :key="item" class="flex items-start gap-2">
        <span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400"></span>
        <span>{{ item }}</span>
      </li>
    </ul>
  </section>
</template>
