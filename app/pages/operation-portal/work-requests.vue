<script setup lang="ts">
import { CheckCircle2, Clock3, XCircle } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { workRequestApi } from '~/api/work-request'
import type { WorkRequestItem, WorkRequestStatus } from '~/types/work-request'

definePageMeta({ layout: 'operation-portal' })

const { $toast } = useNuxtApp()

const loading = ref(true)
const loadError = ref('')
const requests = ref<WorkRequestItem[]>([])
const updatingId = ref<number | null>(null)

const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const response = await workRequestApi.operation.list()
    requests.value = response.data
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Is talepleri yuklenemedi.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const statusMeta: Record<string, { label: string; classes: string; icon: any }> = {
  pending: { label: 'Bekliyor', classes: 'bg-warning-50 text-warning-700', icon: Clock3 },
  approved: { label: 'Onaylandi', classes: 'bg-success-50 text-success-700', icon: CheckCircle2 },
  rejected: { label: 'Reddedildi', classes: 'bg-error-50 text-error-700', icon: XCircle },
  completed: { label: 'Tamamlandi', classes: 'bg-gray-100 text-gray-600', icon: CheckCircle2 },
}

const pendingCount = computed(() => requests.value.filter((r) => r.status === 'pending').length)

const updateStatus = async (item: WorkRequestItem, status: WorkRequestStatus) => {
  updatingId.value = item.id
  try {
    const response = await workRequestApi.operation.updateStatus(item.id, status)
    const index = requests.value.findIndex((r) => r.id === item.id)
    if (index !== -1) requests.value[index] = response.data
    $toast?.success?.('Is talebi durumu guncellendi.')
  } catch (error) {
    $toast?.error?.(error instanceof Error ? error.message : 'Durum guncellenemedi.')
  } finally {
    updatingId.value = null
  }
}
</script>
<template>
  <div class="mx-auto w-full max-w-[1200px] space-y-6">
    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-brand-500">Operasyon Portalı</p>
      <h1 class="mt-1 text-2xl font-semibold">İş Talepleri</h1>
      <p class="mt-1 text-sm text-gray-500">Taseronlara acilan is taleplerini goruntuleyin, onerilen tarihleri degerlendirin ve durumlarini guncelleyin.</p>
    </div>

    <div v-if="loading" class="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Yukleniyor...</div>
    <div v-else-if="loadError" class="rounded-2xl border border-error-200 bg-error-50 p-10 text-center text-sm text-error-600">{{ loadError }}</div>
    <template v-else>
      <div class="rounded-2xl border border-gray-200 bg-white p-5">
        <p class="text-xs text-gray-400">Onay bekleyen</p>
        <p class="mt-1 text-xl font-semibold">{{ pendingCount }}</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white">
        <div class="border-b border-gray-100 p-5">
          <h2 class="font-semibold">Tum Is Talepleri</h2>
        </div>
        <div v-if="requests.length === 0" class="p-10 text-center text-sm text-gray-400">Henuz bir is talebi yok.</div>
        <div v-else class="divide-y divide-gray-100">
          <div v-for="item in requests" :key="item.id" class="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ item.title }}</p>
              <p class="mt-1 text-xs text-gray-400">
                {{ item.contractor?.business_entity?.name ?? item.contractor?.short_name ?? 'Taseron' }}
                · {{ item.organization?.name ?? 'Organizasyon belirtilmemis' }}
                <span v-if="item.requested_date"> · Talep edilen: {{ item.requested_date }}</span>
                <span v-if="item.proposed_date"> · Taseron onerisi: {{ item.proposed_date }}</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" :class="statusMeta[item.status]?.classes">
                <component :is="statusMeta[item.status]?.icon" :size="13" />{{ statusMeta[item.status]?.label ?? item.status }}
              </span>
              <select
                :value="item.status"
                :disabled="updatingId === item.id"
                class="h-9 rounded-lg border border-gray-200 px-2 text-xs"
                @change="updateStatus(item, ($event.target as HTMLSelectElement).value as WorkRequestStatus)"
              >
                <option value="pending">Bekliyor</option>
                <option value="approved">Onayla</option>
                <option value="rejected">Reddet</option>
                <option value="completed">Tamamlandi</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
