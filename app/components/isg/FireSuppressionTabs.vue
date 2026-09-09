<script setup lang="ts">
defineProps<{ active: 'inventory' | 'reports' }>()
</script>

<template>
  <div class="mb-6 inline-flex rounded-lg border border-[#e7e9ed] bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
    <NuxtLink
      to="/isg-portal/desktop/fire-suppression/inventory"
      class="rounded-md px-4 py-2 text-sm font-semibold transition"
      :class="active === 'inventory' ? 'bg-[#d71920] text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
    >
      Envanter
    </NuxtLink>
    <NuxtLink
      to="/isg-portal/desktop/fire-suppression/reports"
      class="rounded-md px-4 py-2 text-sm font-semibold transition"
      :class="active === 'reports' ? 'bg-[#d71920] text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
    >
      Raporlar
    </NuxtLink>
  </div>
</template>
