<script setup lang="ts">
type ContractorSummary = { name: string; shortName: string; type: string; statusText: string }
const props = withDefaults(
  defineProps<{ contractor: ContractorSummary; organizationCount?: number; locationCount?: number }>(),
  { organizationCount: 0, locationCount: 0 },
)
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
  <div class="mb-6 flex items-center justify-between"><div><h2 class="text-sm font-semibold text-gray-900">Genel Bilgiler</h2><p class="mt-1 text-xs text-gray-500">Merkezi havuzdaki firma kaydı.</p></div></div>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"><div><span class="text-xs text-gray-500">Firma Unvanı</span><p class="mt-1 text-sm font-medium text-gray-800">{{ contractor.name }}</p></div><div><span class="text-xs text-gray-500">Kısa Ad</span><p class="mt-1 text-sm font-medium text-gray-800">{{ contractor.shortName }}</p></div><div><span class="text-xs text-gray-500">Tür</span><p class="mt-1 text-sm font-medium text-gray-800">{{ contractor.type }}</p></div><div><span class="text-xs text-gray-500">Durum</span><p class="mt-1 text-sm font-medium text-gray-800">{{ contractor.statusText }}</p></div></div>
  <div class="mt-8 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
    <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-5"><p class="text-xs text-gray-500">Organizasyon Eşleşmesi</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ organizationCount }}</p><p class="mt-2 text-xs leading-5 text-gray-500">Bu firmanın eşleştirildiği holding/grup sayısı.</p></div>
    <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-5"><p class="text-xs text-gray-500">Bağlı Şube/Lokasyon</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ locationCount }}</p><p class="mt-2 text-xs leading-5 text-gray-500">Eşleştirilen organizasyonlar altındaki toplam şube sayısı.</p></div>
  </div>
</section>
</template>
