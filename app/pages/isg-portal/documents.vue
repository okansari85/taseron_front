<script setup lang="ts">
import ContractorComingSoonTab from '~/components/contractors/ContractorComingSoonTab.vue'

definePageMeta({ layout: 'isg-portal' })
</script>
<template>
  <div class="mx-auto w-full max-w-[1100px] space-y-6">
    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-brand-500">İSG Portalı</p>
      <h1 class="mt-1 text-2xl font-semibold">Evrak Onayı</h1>
      <p class="mt-1 text-sm text-gray-500">Personel, araç, ekipman ve kimyasal evraklarının onay ekranı.</p>
    </div>
    <ContractorComingSoonTab
      title="Evrak Onayı"
      description="Bu modül henüz devreye alınmadı. Onaya düşecek gerçek bir evrak/checklist kaydı yok, çünkü Evrak Profili ve Personel modülleri henüz yazılmadı. İş talebi onayı bu ekranın konusu degildir - o akis operation rolu ile taseron arasindadir."
      :items="[
        'Personel bazlı evrak onayı - SGK / MYK referans listesi bekleniyor',
        'Araç, ekipman ve kimyasal evrak onayi',
        'Evrak Profili modülü kurulduktan sonra aktif olacak',
      ]"
    />
  </div>
</template>
