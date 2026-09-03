<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-brand-500">Taşeron Portalı</p>
      <h1 class="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">Layout Önizleme</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Header ve Sidebar mevcut tasarımla aynı layout içinde çalışıyor.
      </p>
    </div>

    <div class="grid gap-5 md:grid-cols-3">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-sm text-gray-500 dark:text-gray-400">Portal</p>
        <p class="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">Taşeron Firma</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-sm text-gray-500 dark:text-gray-400">Layout</p>
        <p class="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">contractor-portal</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-sm text-gray-500 dark:text-gray-400">Tema</p>
        <p class="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">Mevcut Tasarım</p>
      </div>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Örnek içerik alanı</h2>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Bu sayfa sadece yeni layout'u tarayıcıdan görebilmek için oluşturuldu. Buradaki içerik daha sonra gerçek taşeron dashboard'u ile değiştirilebilir.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'contractor-portal',
})
</script>
