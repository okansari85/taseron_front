<script setup lang="ts">
import { Bell, ChevronLeft } from 'lucide-vue-next'

definePageMeta({ layout: 'fire-inspection' })
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <NuxtLink to="/isg-portal/fire-inspection" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Bildirimler</p>
    </header>
    <div class="flex flex-col items-center justify-center gap-2 py-24 text-center text-gray-400">
      <Bell :size="28" />
      <p class="text-sm">Henüz bildirim yok.</p>
    </div>
  </div>
</template>
