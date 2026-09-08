<script setup lang="ts">
import ContractorComingSoonTab from '~/components/contractors/ContractorComingSoonTab.vue'

definePageMeta({ layout: 'contractor-portal' })
</script>
<template>
  <div class="mx-auto w-full max-w-[1100px] space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Evraklarım</h1>
      <p class="mt-1 text-sm text-gray-500">Şirket, personel, araç ve kimyasal bazlı evrak yükleme ve takip ekranı.</p>
    </div>
    <ContractorComingSoonTab
      title="Evrak Profili"
      description="Personel, araç, ekipman ve kimyasal bazlı evrak yükleme ve onay akışı henüz devreye alınmadı. Bu modül, resmi SGK meslek kodu / MYK yükümlülük listesi ve evrak profili tanımları netleştikten sonra kurulacak."
      :items="[
        'Şirket evrakları (vergi levhası, İSG sözleşmesi vb.)',
        'Personel bazlı evrak takibi — SGK / MYK referans listesi bekleniyor',
        'Araç, ekipman ve kimyasal evrak takibi',
      ]"
    />
  </div>
</template>
