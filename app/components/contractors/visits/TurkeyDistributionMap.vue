<script setup lang="ts">
type Distribution = { city: string; count: number; x: number; y: number }

const props = defineProps<{ title: string; distributions: Distribution[]; total: number }>()

const mapUrl = 'https://raw.githubusercontent.com/dnomak/svg-turkiye-haritasi/master/index.html'
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
      <div class="relative flex min-h-[250px] items-center justify-center overflow-hidden rounded-lg bg-white p-3">
        <img :src="mapUrl" alt="Türkiye haritası" class="pointer-events-none h-auto w-full max-w-[620px] opacity-90" />
        <div
          v-for="item in distributions"
          :key="item.city"
          class="absolute -translate-x-1/2 -translate-y-1/2"
          :style="{ left: `${item.x}%`, top: `${item.y}%` }"
        >
          <div class="flex items-center gap-1 rounded-full border border-brand-100 bg-white px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
            <span class="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {{ item.city }} · {{ item.count }}
          </div>
        </div>
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