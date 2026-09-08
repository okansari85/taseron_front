<script setup lang="ts">
import ContractorComingSoonTab from '~/components/contractors/ContractorComingSoonTab.vue'

definePageMeta({ layout: 'contractor-portal' })
</script>
<template>
  <div class="mx-auto w-full max-w-[900px] space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Zorunlu Eğitim</h1>
      <p class="mt-1 text-sm text-gray-500">Saha girişinden önce tamamlanması gereken eğitimler.</p>
    </div>
    <ContractorComingSoonTab
      title="Eğitim Modülü"
      description="Zorunlu eğitim içerikleri, izleme takibi ve saha girişi ön koşulu olarak eğitim tamamlama kontrolü henüz devreye alınmadı."
      :items="['Eğitim video/içerik yönetimi', 'İzleme ilerlemesi takibi', 'Saha girişi öncesi zorunlu eğitim kontrolü']"
    />
  </div>
</template>
