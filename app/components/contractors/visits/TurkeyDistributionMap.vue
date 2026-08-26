<script setup lang="ts">
type Distribution = { city: string; count: number }

defineProps<{ title: string; distributions: Distribution[]; total: number }>()

const mapUrl = 'https://dnomak.com.tr/turkiye-haritasi/'
</script>

<template>
  <div class="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-gray-800">Türkiye Dağılımı</p>
        <p class="mt-1 text-[11px] text-gray-400">{{ title }} · {{ total }} kayıt</p>
      </div>
      <span class="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-600">{{ distributions.length }} şehir</span>
    </div>
    <div class="grid gap-5 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
      <div class="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <iframe :src="mapUrl" title="Türkiye dağılım haritası" class="h-[300px] w-full border-0" loading="lazy" />
      </div>
      <div class="space-y-2">
        <div v-for="item in distributions" :key="item.city" class="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2.5">
          <span class="text-xs font-medium text-gray-700">{{ item.city }}</span>
          <span class="text-xs font-semibold text-brand-600">{{ item.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>