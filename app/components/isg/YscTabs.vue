<script setup lang="ts">
// Sol menüde YSC tek bir link (bkz. IsgSidebar.vue) — bu yüzden YSC bölümü
// içindeki gezinme sayfa-içi sekmelerle yapılıyor (sol menü/header'a
// dokunulmuyor).
defineProps<{ active: 'equipment' | 'annual-controls' }>()
</script>

<template>
  <div class="mb-6 inline-flex rounded-lg border border-[#e7e9ed] bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
    <NuxtLink
      to="/isg-portal/desktop/ysc"
      class="rounded-md px-4 py-2 text-sm font-semibold transition"
      :class="active === 'equipment' ? 'bg-[#d71920] text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
    >
      Ekipmanlar
    </NuxtLink>
    <NuxtLink
      to="/isg-portal/desktop/ysc/annual-controls"
      class="rounded-md px-4 py-2 text-sm font-semibold transition"
      :class="active === 'annual-controls' ? 'bg-[#d71920] text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
    >
      Yıllık Kontrol Raporları
    </NuxtLink>
  </div>
</template>
