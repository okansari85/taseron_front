<template>
  <div class="mb-8 flex flex-wrap items-start justify-center">
    <template v-for="(label, index) in steps" :key="label">
      <div class="flex min-w-[110px] flex-col items-center">
        <div
          :class="[
            'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset',
            index <= current
              ? 'bg-brand-500 text-white ring-brand-500'
              : 'bg-white text-gray-500 ring-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700',
          ]"
        >
          <span v-if="index < current">✓</span>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <span
          :class="[
            'mt-2 text-center text-theme-xs',
            index <= current ? 'font-medium text-gray-800 dark:text-white/90' : 'text-gray-500 dark:text-gray-400',
          ]"
        >
          {{ label }}
        </span>
      </div>

      <div
        v-if="index < steps.length - 1"
        :class="[
          'mt-4 h-0.5 w-20 rounded-full sm:w-24',
          index < current ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700',
        ]"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{ current: number }>()

const steps = ['Tenant Bilgileri', 'İlk Organizasyon', 'Kontrol & Oluştur']
</script>
