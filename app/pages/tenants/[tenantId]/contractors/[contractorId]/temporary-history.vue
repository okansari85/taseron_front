<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { contractorApi, type ContractorApiRecord } from '~/api/contractor'
import WorkRequestsPanel from '~/components/contractors/WorkRequestsPanel.vue'
import ContractorComingSoonTab from '~/components/contractors/ContractorComingSoonTab.vue'

definePageMeta({ layout: 'default' })
const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? '1'))
const contractorId = computed(() =>
  Number(Array.isArray(route.params.contractorId) ? route.params.contractorId[0] : (route.params.contractorId ?? 0)),
)

const loading = ref(true)
const loadError = ref('')
const record = ref<ContractorApiRecord | null>(null)

const name = computed(() => record.value?.business_entity?.name ?? '')
const shortName = computed(() => record.value?.short_name ?? '')
const statusText = computed(() => (record.value?.status === 'active' ? 'Aktif' : 'Pasif'))

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    record.value = await contractorApi.get(contractorId.value)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Alt yüklenici bulunamadı.'
  } finally {
    loading.value = false
  }
})
</script>
<template>
  <div class="font-outfit mx-auto w-full max-w-[1400px]">
    <div v-if="loading" class="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Yükleniyor...</div>
    <div v-else-if="loadError" class="rounded-xl border border-error-200 bg-error-50 p-10 text-center text-sm text-error-600">{{ loadError }}</div>
    <template v-else>
      <div class="mb-6 flex items-start gap-4">
        <NuxtLink :to="`/tenants/${tenantId}/contractors/${contractorId}`" class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]"><ArrowLeft :size="17" /></NuxtLink>
        <div>
          <div class="flex flex-wrap items-center gap-2"><h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Saha Geçmişi</h1><span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">Geçici</span></div>
          <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{{ name }} firmasının iş talebi ve saha ziyaret geçmişi.</p>
        </div>
      </div>
      <section class="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600 dark:bg-brand-500/10">{{ shortName.slice(0, 2).toUpperCase() }}</div>
          <div><h2 class="text-base font-semibold text-gray-900 dark:text-white/90">{{ shortName }}</h2><p class="mt-1 text-xs text-gray-500">{{ name }}</p></div>
          <div class="ml-auto rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-600 dark:bg-success-500/10">{{ statusText }}</div>
        </div>
      </section>
      <div class="mb-5">
        <WorkRequestsPanel :fixed-contractor-id="contractorId" />
      </div>
      <ContractorComingSoonTab
        title="Saha Ziyaret Takvimi"
        description="Lokasyon bazlı fiili saha ziyaret takvimi (giriş-çıkış, personel/ekipman ataması) altyapısı henüz kurulmadı. Yukarıdaki iş talebi listesi gerçek kayıtları gösterir."
        :items="['Ziyaret takvimi ve giriş/çıkış kaydı', 'Ziyaret bazlı personel ve ekipman ataması']"
      />
    </template>
  </div>
</template>
